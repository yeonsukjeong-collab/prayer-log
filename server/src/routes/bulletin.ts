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
// 매주 같은 자리(최근에는 9번째 쪽)에 실리는 경향이 있어, 마지막으로 찾은 위치부터 바깥쪽으로 검색해
// 보통의 경우(순서가 그대로인 주)는 OCR을 한 번만 돌리면 되도록 합니다.
const PASTORAL_LETTER_KEYWORD = "목회편지";
let lastKnownPastoralLetterIndex = 8;

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

// startAt부터 바깥쪽으로(startAt, startAt-1, startAt+1, startAt-2, ...) 검색 순서를 만듭니다.
function searchOrder(length: number, startAt: number): number[] {
  const order: number[] = [];
  const seen = new Set<number>();
  const push = (i: number) => {
    if (i >= 0 && i < length && !seen.has(i)) {
      seen.add(i);
      order.push(i);
    }
  };
  push(startAt);
  for (let offset = 1; order.length < length; offset++) {
    push(startAt - offset);
    push(startAt + offset);
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

    const worker = await createWorker("kor");
    try {
      const startAt = Math.min(lastKnownPastoralLetterIndex, pageImages.length - 1);
      for (const index of searchOrder(pageImages.length, startAt)) {
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
    } finally {
      await worker.terminate();
    }
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
