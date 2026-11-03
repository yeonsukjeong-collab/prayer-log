import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../api/client";

type Difficulty = "easy" | "normal" | "hard";

interface LivePlayer {
  id: string;
  name: string;
  score: number;
  answered: boolean;
  lastOption: string | null;
  lastCorrect: boolean | null;
}

interface LiveGame {
  id: string;
  status: "generating" | "lobby" | "question" | "revealed" | "finished";
  hostName: string;
  isHost: boolean;
  canControl: boolean;
  joined: boolean;
  scope: string;
  difficulty: string;
  current: number;
  total: number;
  question: { question: string; options: string[] } | null;
  answer: string | null;
  explanation: string | null;
  myAnswer: string | null;
  answeredCount: number;
  players: LivePlayer[];
}

// 다른 사람의 진행 상황을 이 간격으로 받아옵니다.
const POLL_MS = 1500;
const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none";
const primaryButton =
  "rounded-xl bg-brand-600 py-3 text-base font-bold text-white hover:bg-brand-700 disabled:opacity-50";

/** 각자 휴대폰으로 같은 문제를 동시에 풀고, 서버가 점수를 모아 주는 방식입니다. */
export function LiveQuiz() {
  const [game, setGame] = useState<LiveGame | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);

  const [scope, setScope] = useState("창세기");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [count, setCount] = useState(5);

  const refresh = useCallback(() => {
    return api
      .get<{ game: LiveGame | null }>("/live-quiz/state")
      .then((res) => setGame(res.game))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  async function act(path: string, body?: unknown) {
    setBusy(true);
    try {
      const res = await api.post<{ game: LiveGame | null }>(`/live-quiz/${path}`, body);
      setGame(res.game);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "요청을 처리하지 못했어요. 다시 시도해주세요.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function createGame() {
    setCreating(true);
    await act("create", { scope: scope.trim() || "창세기", count, difficulty });
    setCreating(false);
  }

  function endGame() {
    if (game?.status !== "finished" && !confirm("진행 중인 퀴즈를 끝낼까요? 모든 참가자의 퀴즈가 종료됩니다.")) return;
    act("end");
  }

  if (!loaded) {
    return <p className="py-10 text-center text-sm text-slate-400">불러오는 중...</p>;
  }

  // 진행 중인 퀴즈가 없으면 새 퀴즈를 여는 화면을 보여줍니다.
  if (!game) {
    return (
      <section className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm">
        <p className="text-center text-sm text-slate-500">
          퀴즈를 열면 목장원들이 각자 휴대폰으로 참가해 같은 문제를 함께 풀어요.
        </p>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-slate-700">📖 출제 범위</span>
          <input
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            maxLength={50}
            placeholder="예: 창세기, 마태복음"
            className={inputClass}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-700">⭐ 난이도</span>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className={inputClass}>
              <option value="easy">쉬움 (어린이용)</option>
              <option value="normal">보통 (일반 성도용)</option>
              <option value="hard">어려움 (대회용)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-700">🔢 문제 수 (1~10)</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={10}
              value={count}
              onChange={(e) => setCount(Math.min(Math.max(Number(e.target.value) || 1, 1), 10))}
              className={`${inputClass} text-center`}
            />
          </label>
        </div>
        <button onClick={createGame} disabled={busy} className={primaryButton}>
          {creating ? "⏳ 문제를 만드는 중... (10~30초)" : "다 함께 풀 퀴즈 열기 🚀"}
        </button>
      </section>
    );
  }

  const q = game.question;
  const notJoined = !game.joined && game.status !== "finished";

  return (
    <div className="flex flex-col gap-4">
      <section className="flex items-center justify-between gap-2 rounded-xl bg-white px-4 py-3 shadow-sm">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-800">
            {game.scope} · {game.difficulty}
          </p>
          <p className="text-xs text-slate-400">진행자: {game.hostName}</p>
        </div>
        {(game.canControl || game.status === "finished") && (
          <button onClick={endGame} disabled={busy} className="shrink-0 text-xs text-slate-400 hover:text-red-500">
            {game.status === "finished" ? "닫기" : "퀴즈 끝내기"}
          </button>
        )}
      </section>

      {notJoined && (
        <button onClick={() => act("join")} disabled={busy} className={primaryButton}>
          🙋 이 퀴즈에 참가하기
        </button>
      )}

      {game.status === "generating" && (
        <section className="flex flex-col items-center gap-3 rounded-xl bg-white p-8 shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
          <p className="font-semibold text-slate-700">⏳ 문제를 출제하고 있어요...</p>
          <p className="text-sm text-slate-400">그동안 참가해서 기다려 주세요.</p>
        </section>
      )}

      {game.status === "lobby" && (
        <section className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm">
          <p className="text-center text-sm font-semibold text-slate-700">
            문제 {game.total}개가 준비됐어요. 참가자가 모이면 시작해요!
          </p>
          {game.canControl ? (
            <button onClick={() => act("start")} disabled={busy} className={primaryButton}>
              시작하기 ▶
            </button>
          ) : (
            <p className="text-center text-xs text-slate-400">{game.hostName}님이 시작하면 문제가 나타나요.</p>
          )}
        </section>
      )}

      {(game.status === "question" || game.status === "revealed") && q && (
        <section className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
              문제 {game.current + 1} / {game.total}
            </span>
            <span className="text-xs text-slate-400">
              {game.answeredCount} / {game.players.length}명 답함
            </span>
          </div>
          <h3 className="break-keep text-center text-lg font-bold leading-snug text-slate-800">{q.question}</h3>

          <ol className="flex flex-col gap-2">
            {q.options.map((opt, i) => {
              const mine = game.myAnswer === opt;
              const revealed = game.status === "revealed";
              const correct = revealed && opt === game.answer;
              const canPick = game.status === "question" && game.joined && !mine && !busy;
              const style = revealed
                ? correct
                  ? "border-emerald-400 bg-emerald-50 font-bold text-emerald-800"
                  : mine
                    ? "border-red-300 bg-red-50 text-red-600"
                    : "border-slate-200 text-slate-400"
                : mine
                  ? "border-brand-500 bg-brand-50 font-bold text-brand-700"
                  : "border-slate-200 text-slate-700";
              return (
                <li key={i}>
                  <button
                    onClick={() => act("answer", { index: game.current, option: opt })}
                    disabled={!canPick}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl border-2 p-3 text-left text-sm ${style} ${
                      canPick ? "hover:border-brand-300" : ""
                    }`}
                  >
                    <span>
                      <span className="mr-2 font-bold text-brand-600">{i + 1}.</span>
                      {opt}
                    </span>
                    {correct && <span className="shrink-0 text-xs">정답 ✔️</span>}
                    {!correct && mine && <span className="shrink-0 text-xs">내 답</span>}
                  </button>
                </li>
              );
            })}
          </ol>

          {game.status === "question" && game.joined && (
            <p className="text-center text-xs text-slate-400">
              {game.myAnswer
                ? "답을 냈어요. 정답 공개 전까지는 다른 보기를 눌러 바꿀 수 있어요."
                : "답을 하나 골라 주세요. 정답 공개 전까지 바꿀 수 있어요."}
            </p>
          )}

          {game.status === "revealed" && (
            <>
              <div className="border-t-2 border-dashed border-slate-200 pt-3">
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                  💡 해설 및 성경 구절
                </span>
                <p className="mt-2 whitespace-pre-wrap break-keep text-sm text-slate-700">
                  {game.explanation || "해설이 없습니다."}
                </p>
              </div>
              <p className="text-sm text-slate-600">
                🎉 맞힌 사람:{" "}
                <span className="font-bold text-emerald-700">
                  {game.players.filter((p) => p.lastCorrect).map((p) => p.name).join(", ") || "아무도 없어요"}
                </span>
              </p>
            </>
          )}

          {game.canControl &&
            (game.status === "question" ? (
              <button onClick={() => act("reveal")} disabled={busy} className="rounded-xl bg-amber-500 py-3 text-base font-bold text-white hover:bg-amber-600 disabled:opacity-50">
                정답 공개하기 👀
              </button>
            ) : (
              <button onClick={() => act("next")} disabled={busy} className={primaryButton}>
                {game.current + 1 >= game.total ? "최종 결과 보기 🏆" : "다음 문제 ➡️"}
              </button>
            ))}
        </section>
      )}

      {game.status === "finished" ? (
        <section className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm">
          <h3 className="text-center text-xl font-extrabold text-amber-500">🎉 최종 결과 발표 🎉</h3>
          <Scoreboard players={game.players} final />
          <p className="text-center text-xs text-slate-400">점수가 같으면 정답을 더 빨리 고른 사람이 앞서요.</p>
        </section>
      ) : (
        game.status !== "generating" && (
          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h4 className="mb-2 text-sm font-semibold text-slate-600">👥 참가자 {game.players.length}명</h4>
            <Scoreboard players={game.players} showAnswered={game.status === "question"} />
          </section>
        )
      )}
    </div>
  );
}

function Scoreboard({
  players,
  final = false,
  showAnswered = false,
}: {
  players: LivePlayer[];
  final?: boolean;
  showAnswered?: boolean;
}) {
  return (
    <ol className="flex flex-col gap-1.5">
      {players.map((p, i) => {
        const medal = final ? (p.score === 0 ? "😅" : (["🥇", "🥈", "🥉"][i] ?? "👏")) : `${i + 1}.`;
        return (
          <li
            key={p.id}
            className={`flex items-center justify-between rounded-lg px-3 py-2 ${
              final && i === 0 && p.score > 0 ? "border-2 border-amber-400 bg-amber-50" : "bg-slate-50"
            }`}
          >
            <span className="text-sm text-slate-700">
              <span className="mr-2">{medal}</span>
              {p.name}
              {showAnswered && (
                <span className={`ml-2 text-xs ${p.answered ? "text-emerald-600" : "text-slate-300"}`}>
                  {p.answered ? "✓ 답함" : "생각 중"}
                </span>
              )}
            </span>
            <span className="text-sm font-bold text-slate-800">{p.score}점</span>
          </li>
        );
      })}
    </ol>
  );
}
