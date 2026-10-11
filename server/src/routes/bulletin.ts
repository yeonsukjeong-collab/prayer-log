import { Router } from "express";
import * as cheerio from "cheerio";
import { createWorker } from "tesseract.js";
import { requireAuth } from "../auth/middleware.js";

const router = Router();
router.use(requireAuth);

const LIST_URL = "http://www.osmcc.or.kr/main/sub.html?pageCode=55";
const SITE_ORIGIN = "http://www.osmcc.or.kr";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

interface Bulletin {
  title: string;
  detailUrl: string;
  thumbnailDataUrl: string | null;
  pastoralLetterDataUrl: string | null;
  fetchedAt: number;
}

let cache: Bulletin | null = null;
let inFlightFetch: Promise<Bulletin> | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// 목회편지는 OCR로 쪽 제목을 읽어서 찾습니다 — 교회가 주보 쪽 순서를 바꿔도 깨지지 않도록 하기 위함입니다.
// 거의 매주 9번째 쪽에 실리므로, 속도를 위해 9쪽 → 7쪽 → 10쪽 순으로 딱 3곳만 확인하고
// (매주 전체를 다 검색하면 느립니다), 찾은 위치를 기억해 두었다가 다음 주에는 그 위치부터 확인합니다.
const PASTORAL_LETTER_KEYWORD = "목회편지";
let lastKnownPastoralLetterIndex = 8; // 0-based (9번째 쪽)
const SEARCH_OFFSETS = [0, -2, 1]; // 9쪽 → 7쪽 → 10쪽

// OCR 엔진 초기화(코어·한국어 학습 데이터 로딩) 비용이 꽤 커서, 요청마다 새로 만들지 않고
// 서버 프로세스 동안 하나만 만들어 재사용합니다.
let workerPromise: ReturnType<typeof createWorker> | null = null;
function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker("kor").catch((err) => {
      workerPromise = null;
      throw err;
    });
  }
  return workerPromise;
}

async function fetchImageAsDataUrl(
  url: string,
): Promise<{ buffer: Buffer; dataUrl: string } | null> {
  try {
    const imgRes = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!imgRes.ok) return null;
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
    return { buffer, dataUrl: `data:${contentType};base64,${buffer.toString("base64")}` };
  } catch {
    return null;
  }
}

function candidateIndexes(length: number, startAt: number): number[] {
  const seen = new Set<number>();
  const order: number[] = [];
  for (const offset of SEARCH_OFFSETS) {
    const index = startAt + offset;
    if (index >= 0 && index < length && !seen.has(index)) {
      seen.add(index);
      order.push(index);
    }
  }
  return order;
}

async function findPastoralLetterDataUrl(detailUrl: string): Promise<string | null> {
  try {
    const detailRes = await fetch(detailUrl, { headers: { "User-Agent": USER_AGENT } });
    if (!detailRes.ok) return null;
    const html = await detailRes.text();
    const $ = cheerio.load(html);

    const pageImages = $("#lightgallery img[id^='ANYBOARDVIEWIMAGE_']")
      .map((_, el) => $(el).attr("src"))
      .get()
      .filter((src): src is string => Boolean(src));

    if (pageImages.length === 0) return null;

    const worker = await getWorker();
    const startAt = Math.min(lastKnownPastoralLetterIndex, pageImages.length - 1);
    for (const index of candidateIndexes(pageImages.length, startAt)) {
      const pageUrl = new URL(pageImages[index], SITE_ORIGIN).toString();
      const fetched = await fetchImageAsDataUrl(pageUrl);
      if (!fetched) continue;

      const { data } = await worker.recognize(fetched.buffer);
      const normalized = data.text.replace(/\s+/g, "");
      if (normalized.includes(PASTORAL_LETTER_KEYWORD)) {
        lastKnownPastoralLetterIndex = index;
        return fetched.dataUrl;
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchLatestBulletin(): Promise<Bulletin> {
  const listRes = await fetch(LIST_URL, { headers: { "User-Agent": USER_AGENT } });
  if (!listRes.ok) {
    throw new Error(`주보 목록 페이지를 불러오지 못했습니다 (${listRes.status}).`);
  }
  const html = await listRes.text();
  const $ = cheerio.load(html);

  const firstBox = $(".mdBoardPhotoWrap").first();
  if (firstBox.length === 0) {
    throw new Error("주보 목록에서 게시물을 찾을 수 없습니다.");
  }

  const detailHref = firstBox.find("a[href*='num=']").first().attr("href");
  const title = firstBox.find(".mdPhoto_sbj a").first().text().trim();
  const style = firstBox.find(".photoimage").attr("style") ?? "";
  const thumbMatch = style.match(/url\((https?:\/\/[^)]+)\)/);
  const thumbnailUrl = thumbMatch?.[1];

  if (!detailHref || !title) {
    throw new Error("주보 게시물 정보를 해석할 수 없습니다.");
  }

  const detailUrl = new URL(detailHref, SITE_ORIGIN).toString();

  const [thumbnailFetched, pastoralLetterDataUrl] = await Promise.all([
    thumbnailUrl ? fetchImageAsDataUrl(thumbnailUrl) : Promise.resolve(null),
    findPastoralLetterDataUrl(detailUrl),
  ]);

  return {
    title,
    detailUrl,
    thumbnailDataUrl: thumbnailFetched?.dataUrl ?? null,
    pastoralLetterDataUrl,
    fetchedAt: Date.now(),
  };
}

function refreshCache(): Promise<Bulletin> {
  if (!inFlightFetch) {
    inFlightFetch = fetchLatestBulletin()
      .then((result) => {
        cache = result;
        return result;
      })
      .finally(() => {
        inFlightFetch = null;
      });
  }
  return inFlightFetch;
}

router.get("/latest", async (_req, res) => {
  const isFresh = cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS;
  if (isFresh) {
    res.json({ item: cache });
    return;
  }

  if (cache) {
    // OCR 재검색은 수 초~수십 초가 걸릴 수 있으므로, 캐시가 있으면 일단 그걸 바로 내려주고
    // 새로고침은 백그라운드에서 진행합니다 (다음 요청부터 최신 데이터 반영).
    res.json({ item: cache, stale: true });
    refreshCache().catch(() => {});
    return;
  }

  try {
    const result = await refreshCache();
    res.json({ item: result });
  } catch {
    res.status(502).json({ error: "주보를 불러오지 못했습니다." });
  }
});

export default router;
