import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { Router } from "express";
// zodOutputFormat은 zod v4 스키마를 받으므로 이 파일만 zod/v4를 씁니다.
import { z } from "zod/v4";
import { env } from "../env.js";
import { requireAuth } from "../auth/middleware.js";

const router = Router();
router.use(requireAuth);

const CLAUDE_MODEL = "claude-opus-5-5";

// 화면에서는 난이도 키만 받고, 프롬프트에 들어갈 설명은 서버에서 정합니다.
const DIFFICULTY_PROMPTS = {
  easy: "주일학교 어린이가 풀 수 있는 아주 쉬운 기초적인",
  normal: "누구나 풀 수 있는 평이한",
  hard: "성경을 깊이 연구한 사람을 위한 꽤 어려운 지엽적인",
} as const;

const requestSchema = z.object({
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

type Question = z.infer<typeof questionSchema>;

const client = env.anthropicApiKey ? new Anthropic({ apiKey: env.anthropicApiKey }) : null;

function buildPrompt(scope: string, count: number, difficulty: keyof typeof DIFFICULTY_PROMPTS) {
  return `너는 교회 소그룹 모임에서 성경 퀴즈를 출제하는 레크리에이션 강사야.
성경의 '${scope}' 부분에서 객관식 퀴즈 ${count}개를 한국어로 내줘.
난이도는 ${DIFFICULTY_PROMPTS[difficulty]} 수준으로 해줘.

- 보기는 반드시 4개이고, answer는 보기 중 하나와 글자까지 정확히 같아야 해.
- 정답이 성경 본문으로 분명하게 확인되는 문제만 내줘. 해석이 갈리는 내용은 피해줘.
- explanation에는 정답에 대한 짧은 해설과 근거가 되는 성경 구절(예: 창세기 3:1)을 적어줘.`;
}

async function generateQuiz(anthropic: Anthropic, prompt: string): Promise<Question[]> {
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
  if (!client) {
    res.status(503).json({ error: "성경퀴즈가 아직 설정되지 않았어요. 관리자에게 알려주세요." });
    return;
  }

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "출제 범위와 문제 수를 확인해주세요." });
    return;
  }
  const { scope, count, difficulty } = parsed.data;

  try {
    const questions = await generateQuiz(client, buildPrompt(scope, count, difficulty));
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
