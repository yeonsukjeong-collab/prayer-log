import { Router } from "express";
import { z } from "zod";
import { env } from "../env.js";
import { requireAuth } from "../auth/middleware.js";

const router = Router();
router.use(requireAuth);

const GEMINI_MODEL = "gemini-2.5-flash";

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
  question: z.string().trim().min(1),
  options: z.array(z.string().trim().min(1)).length(4),
  answer: z.string().trim().min(1),
  explanation: z.string().trim().optional().default(""),
});

type Question = z.infer<typeof questionSchema>;

function buildPrompt(scope: string, count: number, difficulty: keyof typeof DIFFICULTY_PROMPTS) {
  return `
너는 성경 퀴즈를 출제하는 전문 레크리에이션 강사야.
성경의 '${scope}' 부분에서 객관식 퀴즈 ${count}개를 내줘.
난이도는 ${DIFFICULTY_PROMPTS[difficulty]} 수준으로 해줘.
보기는 반드시 4개이고, 정답은 보기 중 하나와 글자까지 정확히 같아야 해.
반드시 아래의 JSON 배열 형식으로만 대답해.

[
  {"question": "질문 내용", "options": ["보기1", "보기2", "보기3", "보기4"], "answer": "정답 텍스트 (보기 중 하나와 정확히 일치)", "explanation": "해설 및 관련 성경 구절"}
]
`;
}

async function generateQuiz(apiKey: string, prompt: string): Promise<Question[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`Gemini 요청 실패 (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  const parsed: unknown = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error("Gemini 응답이 배열이 아닙니다.");

  // 형식이 맞지 않거나 정답이 보기에 없는 문제는 빼고 보여줍니다.
  return parsed.flatMap((item) => {
    const q = questionSchema.safeParse(item);
    if (!q.success || !q.data.options.includes(q.data.answer)) return [];
    return [q.data];
  });
}

router.post("/", async (req, res) => {
  if (!env.geminiApiKey) {
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
    const questions = await generateQuiz(env.geminiApiKey, buildPrompt(scope, count, difficulty));
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
