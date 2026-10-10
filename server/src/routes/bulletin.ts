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
  fetchedAt: number;
}

let cache: Bulletin | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

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

  let thumbnailDataUrl: string | null = null;
  if (thumbnailUrl) {
    try {
      const imgRes = await fetch(thumbnailUrl, { headers: { "User-Agent": USER_AGENT } });
      if (imgRes.ok) {
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
        thumbnailDataUrl = `data:${contentType};base64,${buffer.toString("base64")}`;
      }
    } catch {
      // thumbnail is optional — fall through with null and still show the title/link
    }
  }

  return { title, detailUrl, thumbnailDataUrl, fetchedAt: Date.now() };
}

router.get("/latest", async (_req, res) => {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    res.json({ item: cache });
    return;
  }

  try {
    cache = await fetchLatestBulletin();
    res.json({ item: cache });
  } catch (err) {
    if (cache) {
      res.json({ item: cache, stale: true });
      return;
    }
    res.status(502).json({ error: "주보를 불러오지 못했습니다." });
  }
});

export default router;
