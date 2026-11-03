import { Router, type Request, type Response } from "express";
import { z } from "zod/v4";
import { prisma } from "../db.js";
import { requireAuth } from "../auth/middleware.js";
import { buildPrompt, generateQuiz, quizClient, quizRequestSchema, type Question } from "./bibleQuiz.js";

/**
 * 목장원이 각자 휴대폰으로 같은 문제를 동시에 푸는 "다 함께 풀기" 성경퀴즈입니다.
 *
 * - 목장 전체에 진행 중인 게임은 한 번에 하나뿐이고, 서버 메모리에만 둡니다(DB에 저장하지 않음).
 *   서버가 다시 시작되면(배포, Render 슬립) 진행 중인 게임은 사라집니다.
 * - 화면은 몇 초마다 GET /state 로 현재 상태를 받아 갑니다.
 * - 퀴즈를 연 사람이 진행자이고, 목자는 언제든 진행하거나 끝낼 수 있습니다.
 */

const router = Router();
router.use(requireAuth);

type Status = "generating" | "lobby" | "question" | "revealed" | "finished";

interface Player {
  id: string;
  name: string;
  score: number;
  /** 맞힌 문제를 푸는 데 걸린 시간의 합(ms). 점수가 같으면 빨리 푼 사람이 앞섭니다. */
  correctTimeMs: number;
  joinedAt: number;
}

interface Answer {
  option: string;
  elapsedMs: number;
}

interface Game {
  id: string;
  status: Status;
  hostId: string;
  hostName: string;
  scope: string;
  difficulty: string;
  questions: Question[];
  current: number;
  questionStartedAt: number;
  players: Map<string, Player>;
  /** 현재 문제에 대한 답. 문제가 바뀌면 비웁니다. */
  answers: Map<string, Answer>;
  updatedAt: number;
}

const DIFFICULTY_LABELS = { easy: "쉬움", normal: "보통", hard: "어려움" } as const;
// 이 시간 동안 아무도 진행하지 않은 게임은 버려진 것으로 보고 새 게임을 열 수 있게 합니다.
const STALE_MS = 2 * 60 * 60 * 1000;

let game: Game | null = null;

function currentGame(): Game | null {
  if (game && Date.now() - game.updatedAt > STALE_MS) game = null;
  return game;
}

function touch(g: Game) {
  g.updatedAt = Date.now();
}

async function getMember(userId: string | undefined) {
  return prisma.member.findUnique({ where: { id: userId }, select: { id: true, name: true, isLeader: true } });
}

function addPlayer(g: Game, member: { id: string; name: string }) {
  if (!g.players.has(member.id)) {
    g.players.set(member.id, { id: member.id, name: member.name, score: 0, correctTimeMs: 0, joinedAt: Date.now() });
  }
}

function ranking(g: Game) {
  return [...g.players.values()].sort(
    (a, b) => b.score - a.score || a.correctTimeMs - b.correctTimeMs || a.joinedAt - b.joinedAt,
  );
}

/** 화면에 보낼 상태입니다. 정답은 공개 단계가 되기 전에는 보내지 않습니다. */
function publicState(g: Game, userId: string, isLeader: boolean) {
  const q = g.questions[g.current];
  const showQuestion = g.status === "question" || g.status === "revealed";
  const revealed = g.status === "revealed";
  const myAnswer = g.answers.get(userId)?.option ?? null;

  return {
    id: g.id,
    status: g.status,
    hostName: g.hostName,
    isHost: g.hostId === userId,
    canControl: g.hostId === userId || isLeader,
    joined: g.players.has(userId),
    scope: g.scope,
    difficulty: g.difficulty,
    current: g.current,
    total: g.questions.length,
    question: showQuestion && q ? { question: q.question, options: q.options } : null,
    answer: revealed && q ? q.answer : null,
    explanation: revealed && q ? q.explanation : null,
    myAnswer,
    answeredCount: g.answers.size,
    players: ranking(g).map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      answered: g.answers.has(p.id),
      // 정답 공개 후에만 각자 무엇을 골랐는지 보여줍니다.
      lastOption: revealed ? (g.answers.get(p.id)?.option ?? null) : null,
      lastCorrect: revealed && q ? g.answers.get(p.id)?.option === q.answer : null,
    })),
  };
}

async function sendState(req: Request, res: Response) {
  const g = currentGame();
  if (!g) {
    res.json({ game: null });
    return;
  }
  const member = await getMember(req.userId);
  res.json({ game: publicState(g, req.userId!, Boolean(member?.isLeader)) });
}

router.get("/state", sendState);

router.post("/create", async (req, res) => {
  if (!quizClient) {
    res.status(503).json({ error: "성경퀴즈가 아직 설정되지 않았어요. 관리자에게 알려주세요." });
    return;
  }
  const parsed = quizRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "출제 범위와 문제 수를 확인해주세요." });
    return;
  }
  const member = await getMember(req.userId);
  if (!member) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const existing = currentGame();
  if (existing && existing.status !== "finished") {
    res.status(409).json({ error: `${existing.hostName}님이 진행 중인 퀴즈가 있어요. 그 퀴즈에 참가하거나 끝난 뒤에 열어주세요.` });
    return;
  }

  const { scope, count, difficulty } = parsed.data;
  const g: Game = {
    id: crypto.randomUUID(),
    status: "generating",
    hostId: member.id,
    hostName: member.name,
    scope,
    difficulty: DIFFICULTY_LABELS[difficulty],
    questions: [],
    current: 0,
    questionStartedAt: 0,
    players: new Map(),
    answers: new Map(),
    updatedAt: Date.now(),
  };
  addPlayer(g, member);
  // 문제를 만드는 동안 다른 사람에게도 "출제 중"으로 보이고, 미리 참가할 수 있습니다.
  game = g;

  try {
    const questions = await generateQuiz(quizClient, buildPrompt(scope, count, difficulty));
    if (game !== g) return; // 그 사이 목자가 게임을 끝냈습니다.
    if (questions.length === 0) throw new Error("No valid questions");
    g.questions = questions;
    g.status = "lobby";
    touch(g);
    await sendState(req, res);
  } catch (err) {
    console.error(err);
    if (game === g) game = null;
    res.status(502).json({ error: "퀴즈를 생성하는 데 문제가 발생했습니다. 다시 시도해주세요." });
  }
});

router.post("/join", async (req, res) => {
  const g = currentGame();
  const member = await getMember(req.userId);
  if (!g || g.status === "finished" || !member) {
    res.status(404).json({ error: "참가할 수 있는 퀴즈가 없어요." });
    return;
  }
  // 문제를 푸는 중간에 들어와도 다음 답부터 참여할 수 있습니다.
  addPlayer(g, member);
  touch(g);
  await sendState(req, res);
});

const answerSchema = z.object({ index: z.number().int().min(0), option: z.string() });

router.post("/answer", async (req, res) => {
  const g = currentGame();
  const parsed = answerSchema.safeParse(req.body);
  if (!g || !parsed.success) {
    res.status(400).json({ error: "답을 보낼 수 없어요." });
    return;
  }
  const q = g.questions[g.current];
  const { index, option } = parsed.data;
  if (g.status !== "question" || index !== g.current || !q?.options.includes(option)) {
    res.status(409).json({ error: "이미 정답이 공개되었거나 지난 문제예요." });
    return;
  }
  if (!g.players.has(req.userId!)) {
    res.status(403).json({ error: "먼저 퀴즈에 참가해주세요." });
    return;
  }
  // 정답 공개 전까지는 답을 바꿀 수 있고, 마지막에 고른 답과 그 시각을 인정합니다.
  if (g.answers.get(req.userId!)?.option !== option) {
    g.answers.set(req.userId!, { option, elapsedMs: Date.now() - g.questionStartedAt });
    touch(g);
  }
  await sendState(req, res);
});

/** 진행자(퀴즈를 연 사람)나 목자만 할 수 있는 동작입니다. */
function control(action: (g: Game) => string | null) {
  return async (req: Request, res: Response) => {
    const g = currentGame();
    if (!g) {
      res.status(404).json({ error: "진행 중인 퀴즈가 없어요." });
      return;
    }
    const member = await getMember(req.userId);
    if (g.hostId !== req.userId && !member?.isLeader) {
      res.status(403).json({ error: "진행자만 할 수 있어요." });
      return;
    }
    const error = action(g);
    if (error) {
      res.status(409).json({ error });
      return;
    }
    touch(g);
    await sendState(req, res);
  };
}

function startQuestion(g: Game, index: number) {
  g.current = index;
  g.answers = new Map();
  g.questionStartedAt = Date.now();
  g.status = "question";
}

router.post(
  "/start",
  control((g) => {
    if (g.status !== "lobby") return "지금은 시작할 수 없어요.";
    startQuestion(g, 0);
    return null;
  }),
);

router.post(
  "/reveal",
  control((g) => {
    if (g.status !== "question") return "지금은 정답을 공개할 수 없어요.";
    const q = g.questions[g.current];
    for (const [playerId, answer] of g.answers) {
      const player = g.players.get(playerId);
      if (player && answer.option === q.answer) {
        player.score += 1;
        player.correctTimeMs += answer.elapsedMs;
      }
    }
    g.status = "revealed";
    return null;
  }),
);

router.post(
  "/next",
  control((g) => {
    if (g.status !== "revealed") return "먼저 정답을 공개해주세요.";
    if (g.current + 1 >= g.questions.length) {
      g.status = "finished";
    } else {
      startQuestion(g, g.current + 1);
    }
    return null;
  }),
);

router.post("/end", async (req, res) => {
  const g = currentGame();
  const member = await getMember(req.userId);
  if (g && g.hostId !== req.userId && !member?.isLeader && g.status !== "finished") {
    res.status(403).json({ error: "진행자만 퀴즈를 끝낼 수 있어요." });
    return;
  }
  game = null;
  res.json({ game: null });
});

export default router;
