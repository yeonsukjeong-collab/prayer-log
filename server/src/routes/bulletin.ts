import { Router } from "express";
import * as cheerio from "cheerio";
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
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// 교회 주보는 매주 같은 쪽 순서(표지 → 합심기도제목 → 감사제목 → ... → 목회편지 → ...)를
// 템플릿으로 사용하며, 목회편지는 항상 갤러리의 9번째 이미지(0-based index 8)에 위치합니다.
const PASTORAL_LETTER_IMAGE_INDEX = 8;

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const imgRes = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!imgRes.ok) return null;
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
    return `data:${contentType};base64,${buffer.toString("base64")}`;
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

  const [thumbnailDataUrl, pastoralLetterDataUrl] = await Promise.all([
    thumbnailUrl ? fetchImageAsDataUrl(thumbnailUrl) : Promise.resolve(null),
    fetchPastoralLetterDataUrl(detailUrl),
  ]);

  return { title, detailUrl, thumbnailDataUrl, pastoralLetterDataUrl, fetchedAt: Date.now() };
}

async function fetchPastoralLetterDataUrl(detailUrl: string): Promise<string | null> {
  try {
    const detailRes = await fetch(detailUrl, { headers: { "User-Agent": USER_AGENT } });
    if (!detailRes.ok) return null;
    const html = await detailRes.text();
    const $ = cheerio.load(html);

    const pageImages = $("#lightgallery img[id^='ANYBOARDVIEWIMAGE_']")
      .map((_, el) => $(el).attr("src"))
      .get()
      .filter((src): src is string => Boolean(src));

    const pastoralLetterSrc = pageImages[PASTORAL_LETTER_IMAGE_INDEX];
    if (!pastoralLetterSrc) return null;

    const pastoralLetterUrl = new URL(pastoralLetterSrc, SITE_ORIGIN).toString();
    return await fetchImageAsDataUrl(pastoralLetterUrl);
  } catch {
    return null;
  }
}

router.get("/latest", async (_req, res) => {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    res.json({ item: cache });
    return;
  }

  try {
    cache = await fetchLatestBulletin();
    res.json({ item: cache });
  } catch {
    if (cache) {
      res.json({ item: cache, stale: true });
      return;
    }
    res.status(502).json({ error: "주보를 불러오지 못했습니다." });
  }
});

export default router;
