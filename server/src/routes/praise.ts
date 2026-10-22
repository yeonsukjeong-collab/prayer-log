import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";

const router = Router();
router.use(requireAuth);

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

// 오늘의 찬양 후보입니다. 영상 주소 대신 곡 제목만 두고, 그날 고른 곡을 유튜브에서 검색해
// 한 곡짜리 영상을 찾습니다. 곡을 더하거나 빼려면 이 목록만 고치면 됩니다.
export const SONGS = [
  "나는 예배자입니다",
  "은혜",
  "주 은혜임을",
  "내 영혼이 은총 입어",
  "보소서 주님",
  "예수 사랑하심은",
  "주 하나님 지으신 모든 세계",
  "나 같은 죄인 살리신",
  "오직 예수 뿐이네",
  "날 구원하신 주 감사",
  "하나님의 은혜",
  "사랑합니다 나의 예수님",
  "당신은 사랑받기 위해 태어난 사람",
  "내 주를 가까이 하게 함은",
  "십자가 그 사랑",
  "주 예수보다 더 귀한 것은 없네",
  "은혜 아니면",
  "아무것도 두려워 말라",
  "광야를 지나며",
  "꽃들도",
  "요게벳의 노래",
  "원하고 바라고 기도합니다",
  "예수 우리 왕이여",
  "주님만 주님만 주님만 사랑하리",
  "하나님은 너를 지키시는 자",
  "주의 집에 거하는 자",
  "전능하신 나의 주 하나님은",
  "위대하신 주",
  "실로암",
  "마음이 상한 자를",
  "주 품에",
  "나의 안에 거하라",
  "내가 주인 삼은",
  "은혜로다",
  "성령이 오셨네",
  "하나님의 세계",
  "오 신실하신 주",
  "우리 보좌 앞에 모였네",
  "그 사랑",
  "주 날 구원했으니",
  "나의 가장 낮은 마음",
  "주님 내 길을 예비하시니",
  "주의 이름 높이며",
  "약할 때 강함 되시네",
  "여호와는 나의 목자시니",
  "모든 상황 속에서",
  "주님의 사랑이 이 곳에",
  "예배합니다",
];

// 제목이 흔해서 엉뚱한 곡이 걸리기 쉬운 곡은 검색어에 가수 이름을 덧붙입니다.
const SEARCH_HINTS: Record<string, string> = {
  은혜: "손경민",
  "그 사랑": "마커스",
  "주 품에": "어노인팅",
};

// 여러 곡을 이어 붙인 영상(메들리·모음집)을 걸러내기 위한 제목 단어입니다.
const MEDLEY_WORDS = ["+", "모음", "연속", "메들리", "medley", "베스트", "best", "시간", "playlist", "플레이리스트", "full", "실황",
  // 노래 대신 율동·반주용으로 만든 영상도 뺍니다.
  "안무", "율동", "mr", "반주", "노래방", "inst", "악보"];
const MIN_SECONDS = 2 * 60;
const MAX_SECONDS = 8 * 60;

interface Praise {
  date: string;
  /** 그날 찾은 곡 중 몇 번째인지(0부터). "다음" 버튼을 누를 때마다 1씩 늘어납니다. */
  index: number;
  songTitle: string;
  videoId: string;
  videoTitle: string;
}

/** 그날 찾은 곡들과, 다음에 검색해 볼 후보 곡의 위치입니다. 날짜가 바뀌면 새로 시작합니다. */
let today: { date: string; found: Praise[]; nextCandidate: number } | null = null;
// 여러 사람이 동시에 "다음"을 눌러도 같은 곡을 두 번 검색하지 않도록 한 번에 하나씩 처리합니다.
let queue: Promise<unknown> = Promise.resolve();

/** 자카르타 시간 기준 오늘 날짜(YYYY-MM-DD)입니다. 모든 목장원이 같은 날 같은 곡을 봅니다. */
function todayInJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

/**
 * 날짜마다 곡 순서를 정합니다. 17은 곡 수와 서로소이므로 모든 곡을 한 번씩 돈 뒤에야
 * 같은 곡이 다시 나오고, 날마다 목록에서 멀리 떨어진 곡으로 건너뛰어 무작위처럼 보입니다.
 */
function songOrderFor(date: string): string[] {
  const dayNumber = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
  const step = 17;
  return SONGS.map((_, i) => SONGS[((dayNumber + i) * step) % SONGS.length]);
}

function parseLength(text: string | undefined): number | null {
  if (!text) return null;
  const parts = text.split(":").map(Number);
  if (parts.some((n) => Number.isNaN(n))) return null;
  return parts.reduce((total, n) => total * 60 + n, 0);
}

const normalize = (s: string) => s.replace(/\s+/g, "").toLowerCase();

/**
 * "나는 예배자입니다 / 예배합니다", "주 품에 & 그 크신 하나님의 사랑"처럼 " / "나 "&" 양쪽에 모두 한글 제목이 있으면 두 곡 이상을 이어 부른 영상입니다.
 * "실로암 / SILOAM"처럼 한글 제목과 영어 제목을 나란히 쓴 경우는 한 곡으로 봅니다.
 */
function hasSeveralKoreanTitles(title: string): boolean {
  return title.split(/ \/ |&/).filter((part) => /[가-힣]/.test(part)).length >= 2;
}

interface SearchResult {
  videoId: string;
  title: string;
  seconds: number | null;
}

async function searchYouTube(query: string): Promise<SearchResult[]> {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=ko&gl=KR`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, "Accept-Language": "ko-KR,ko;q=0.9" } });
  if (!res.ok) throw new Error(`유튜브 검색에 실패했습니다 (${res.status}).`);
  const html = await res.text();
  const match = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
  if (!match) throw new Error("유튜브 검색 결과를 읽지 못했습니다.");

  const results: SearchResult[] = [];
  (function walk(node: unknown) {
    if (!node || typeof node !== "object") return;
    const renderer = (node as { videoRenderer?: Record<string, any> }).videoRenderer;
    if (renderer?.videoId) {
      results.push({
        videoId: renderer.videoId,
        title: renderer.title?.runs?.map((r: { text: string }) => r.text).join("") ?? "",
        seconds: parseLength(renderer.lengthText?.simpleText),
      });
    }
    for (const value of Object.values(node)) walk(value);
  })(JSON.parse(match[1]));
  return results;
}

/** 유튜브 밖(앱 안)에서 재생을 막아 둔 영상은 oEmbed가 실패합니다. */
async function isEmbeddable(videoId: string): Promise<boolean> {
  const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  return res.ok;
}

export async function findSingleSongVideo(songTitle: string): Promise<SearchResult | null> {
  const titleKey = normalize(songTitle);
  const hint = SEARCH_HINTS[songTitle];
  const results = await searchYouTube(`${songTitle} ${hint ?? ""} 찬양`.replace(/\s+/g, " "));

  for (const r of results) {
    const title = r.title.toLowerCase();
    if (r.seconds === null || r.seconds < MIN_SECONDS || r.seconds > MAX_SECONDS) continue;
    if (MEDLEY_WORDS.some((w) => title.includes(w))) continue;
    if (hasSeveralKoreanTitles(r.title)) continue;
    if (!normalize(r.title).includes(titleKey)) continue;
    if (!(await isEmbeddable(r.videoId))) continue;
    return r;
  }
  return null;
}

async function findPraise(index: number): Promise<Praise> {
  const date = todayInJakarta();
  if (today?.date !== date) today = { date, found: [], nextCandidate: 0 };
  const state = today;
  const order = songOrderFor(date);

  // 그날 순서대로 곡을 검색해, 조건에 맞는 영상을 찾은 곡만 차례로 쌓습니다.
  while (state.found.length <= index && state.nextCandidate < order.length) {
    const songTitle = order[state.nextCandidate++];
    const video = await findSingleSongVideo(songTitle);
    if (video) {
      state.found.push({
        date,
        index: state.found.length,
        songTitle,
        videoId: video.videoId,
        videoTitle: video.title,
      });
    }
  }

  if (state.found.length === 0) throw new Error("오늘의 찬양 영상을 찾지 못했습니다.");
  // 목록을 다 돌았으면 처음 곡부터 다시 보여줍니다.
  return state.found[index % state.found.length];
}

function getPraise(index: number): Promise<Praise> {
  const result = queue.then(() => findPraise(index));
  queue = result.catch(() => {});
  return result;
}

router.get("/", async (req, res) => {
  const index = Number(req.query.index ?? 0);
  if (!Number.isInteger(index) || index < 0 || index > 1000) {
    res.status(400).json({ error: "Invalid index" });
    return;
  }
  try {
    res.json({ item: await getPraise(index) });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: err instanceof Error ? err.message : "오늘의 찬양을 불러오지 못했습니다." });
  }
});

export default router;
