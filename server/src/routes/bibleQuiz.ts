import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { Router } from "express";
// zodOutputFormat은 zod v4 스키마를 받으므로 이 파일만 zod/v4를 씁니다.
import { z } from "zod/v4";
import { env } from "../env.js";
import { prisma } from "../db.js";
import { requireAuth } from "../auth/middleware.js";
import { BIBLE_CHAPTERS } from "../utils/bibleChapters.js";

const router = Router();
router.use(requireAuth);

const CLAUDE_MODEL = "claude-opus-5-5";

// 화면에서는 난이도 키만 받고, 프롬프트에 들어갈 설명은 서버에서 정합니다.
const DIFFICULTY_PROMPTS = {
  easy: "주일학교 어린이가 풀 수 있는 아주 쉬운 기초적인",
  normal: "누구나 풀 수 있는 평이한",
  hard: "성경을 깊이 연구한 사람을 위한 꽤 어려운 지엽적인",
} as const;

export const quizRequestSchema = z.object({
  scope: z.string().trim().min(1).max(50),
  count: z.number().int().min(1).max(10),
  difficulty: z.enum(["easy", "normal", "hard"]),
});

const questionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  answer: z.string(),
  explanation: z.string(),
});

// Claude가 이 형식의 JSON으로만 답하도록 구조화 출력(structured outputs)으로 지정합니다.
const quizSchema = z.object({ questions: z.array(questionSchema) });

export type Question = z.infer<typeof questionSchema>;

export const quizClient = env.anthropicApiKey ? new Anthropic({ apiKey: env.anthropicApiKey }) : null;

// 같은 범위에서도 매번 다른 문제가 나오도록, 출제할 때마다 이 중 몇 가지를 골라 초점으로 줍니다.
const QUESTION_ANGLES = [
  "등장인물이 누구인지",
  "장소나 지명",
  "숫자(나이, 기간, 사람 수, 물건의 개수 등)",
  "사건이 일어난 순서",
  "누가 누구에게 한 말인지",
  "등장하는 물건이나 동물, 음식",
  "하나님의 명령이나 약속의 내용",
  "기적이나 표적",
  "기도나 찬양의 내용",
  "가르침이나 비유의 내용",
  "가족 관계(부모, 자녀, 형제, 배우자)",
  "직업이나 신분, 지파",
  "어떤 일의 이유나 결과",
  "유명한 구절의 빈칸 채우기",
];
// 이만큼의 최근 문제를 프롬프트에 넣어 피하게 합니다.
const AVOID_COUNT = 80;
// 범위마다 이보다 오래된 기록은 지웁니다.
const KEEP_COUNT = 300;

function pickRandom<T>(items: readonly T[], n: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

/** 범위가 책 한 권이면 그중 무작위 장 구간(전체의 약 1/3)을 골라 줍니다. */
function randomChapterRange(scope: string): string | null {
  const book = scope.replace(/\s/g, "");
  const chapters = BIBLE_CHAPTERS[book];
  if (!chapters || chapters < 3) return null;
  const size = Math.max(2, Math.ceil(chapters / 3));
  const start = 1 + Math.floor(Math.random() * (chapters - size + 1));
  const unit = book === "시편" ? "편" : "장";
  return `${book} ${start}${unit}~${start + size - 1}${unit}`;
}

/** 같은 범위를 띄어쓰기만 달리 써도 같은 기록을 쓰도록 맞춥니다. */
function historyKey(scope: string) {
  return scope.replace(/\s/g, "");
}

export function buildPrompt(
  scope: string,
  count: number,
  difficulty: keyof typeof DIFFICULTY_PROMPTS,
  recent: string[] = [],
) {
  const range = randomChapterRange(scope);
  const angles = pickRandom(QUESTION_ANGLES, 4);
  const avoid = recent.length
    ? "\n\n아래는 이 범위에서 최근에 이미 낸 문제야. 이 문제들과 같거나, 표현만 바꿔 같은 사실을 묻는 문제는 절대 내지 마. " +
      "이번에는 이 문제들이 다루지 않은 사건·인물·내용에서 내줘.\n" +
      recent.map((q) => `- ${q}`).join("\n")
    : "";

  return `너는 교회 소그룹 모임에서 성경 퀴즈를 출제하는 레크리에이션 강사야.
성경의 '${scope}' 부분에서 객관식 퀴즈 ${count}개를 한국어로 내줘.
난이도는 ${DIFFICULTY_PROMPTS[difficulty]} 수준으로 해줘.

- 보기는 반드시 4개이고, answer는 보기 중 하나와 글자까지 정확히 같아야 해.
- 정답이 성경 본문으로 분명하게 확인되는 문제만 내줘. 해석이 갈리는 내용은 피해줘.
- explanation에는 정답에 대한 짧은 해설과 근거가 되는 성경 구절(예: 창세기 3:1)을 적어줘.
- 누구나 떠올리는 가장 유명한 장면만 반복하지 말고, 범위 곳곳에서 고르게 골라 매번 새로운 문제를 내줘.
- 이번에는 특히 ${angles.join(", ")}을(를) 묻는 문제를 섞어 줘.${
    range ? `\n- 이번에는 주로 ${range} 안에서 출제해줘.` : ""
  }${avoid}`;
}

/** 범위에 맞춰 최근 문제를 피해 새 퀴즈를 만들고, 낸 문제를 기록해 둡니다. */
export async function createQuiz(
  anthropic: Anthropic,
  scope: string,
  count: number,
  difficulty: keyof typeof DIFFICULTY_PROMPTS,
): Promise<Question[]> {
  const key = historyKey(scope);
  const recent = await prisma.quizHistory
    .findMany({ where: { scope: key }, orderBy: { createdAt: "desc" }, take: AVOID_COUNT, select: { question: true } })
    .catch((err) => {
      // 기록을 못 읽어도 퀴즈는 낼 수 있게 합니다.
      console.error(err);
      return [];
    });

  const questions = await generateQuiz(anthropic, buildPrompt(scope, count, difficulty, recent.map((r) => r.question)));

  try {
    await prisma.quizHistory.createMany({ data: questions.map((q) => ({ scope: key, question: q.question })) });
    const old = await prisma.quizHistory.findMany({
      where: { scope: key },
      orderBy: { createdAt: "desc" },
      skip: KEEP_COUNT,
      select: { id: true },
    });
    if (old.length) await prisma.quizHistory.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });
  } catch (err) {
    console.error(err);
  }
  return questions;
}

export async function generateQuiz(anthropic: Anthropic, prompt: string): Promise<Question[]> {
  const response = await anthropic.beta.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 16000,
    // Claude가 안전 정책으로 거절하면 같은 요청을 다른 모델로 자동으로 다시 시도합니다.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { format: zodOutputFormat(quizSchema) },
    messages: [{ role: "user", content: prompt }],
  });

  if (response.stop_reason === "refusal") throw new Error("Claude가 퀴즈 생성을 거절했습니다.");
  const questions = response.parsed_output?.questions ?? [];

  // 보기가 4개가 아니거나 정답이 보기에 없는 문제는 빼고 보여줍니다.
  return questions
    .map((q) => ({
      question: q.question.trim(),
      options: q.options.map((o) => o.trim()),
      answer: q.answer.trim(),
      explanation: q.explanation.trim(),
    }))
    .filter((q) => q.question && q.options.length === 4 && q.options.includes(q.answer));
}

router.post("/", async (req, res) => {
  if (!quizClient) {
    res.status(503).json({ error: "성경퀴즈가 아직 설정되지 않았어요. 관리자에게 알려주세요." });
    return;
  }

  const parsed = quizRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "출제 범위와 문제 수를 확인해주세요." });
    return;
  }
  const { scope, count, difficulty } = parsed.data;

  try {
    const questions = await createQuiz(quizClient, scope, count, difficulty);
    if (questions.length === 0) {
      res.status(502).json({ error: "퀴즈를 만들지 못했어요. 다시 시도해주세요." });
      return;
    }
    res.json({ questions });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "퀴즈를 생성하는 데 문제가 발생했습니다. 다시 시도해주세요." });
  }
});

export default router;
