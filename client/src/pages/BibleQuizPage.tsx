import { useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { Member } from "../types";

type Difficulty = "easy" | "normal" | "hard";
type Screen = "setup" | "loading" | "quiz" | "answer" | "result";

interface Question {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

const MAX_PEOPLE = 10;
const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none";

export function BibleQuizPage() {
  const { user } = useAuth();
  const [screen, setScreen] = useState<Screen>("setup");
  const [members, setMembers] = useState<Member[]>([]);

  const [scope, setScope] = useState("창세기");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [count, setCount] = useState(5);
  const [names, setNames] = useState<string[]>(() => [user?.name ?? "", "", ""]);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [participants, setParticipants] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [scoredThisRound, setScoredThisRound] = useState<string[]>([]);

  useEffect(() => {
    api.get<{ members: Member[] }>("/members").then((res) => setMembers(res.members));
  }, []);

  function setPeopleCount(value: number) {
    const n = Math.min(Math.max(value || 1, 1), MAX_PEOPLE);
    setNames((prev) => Array.from({ length: n }, (_, i) => prev[i] ?? ""));
  }

  async function startGame() {
    const players = names.map((n, i) => n.trim() || `참여자 ${i + 1}`);
    setParticipants(players);
    setScores(Object.fromEntries(players.map((p) => [p, 0])));
    setScreen("loading");

    try {
      const res = await api.post<{ questions: Question[] }>("/bible-quiz", {
        scope: scope.trim() || "창세기",
        count,
        difficulty,
      });
      setQuestions(res.questions);
      setCurrent(0);
      setScoredThisRound([]);
      setScreen("quiz");
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "퀴즈를 불러오지 못했어요. 다시 시도해주세요.");
      setScreen("setup");
    }
  }

  function givePoint(name: string) {
    if (scoredThisRound.includes(name)) return;
    setScores((prev) => ({ ...prev, [name]: (prev[name] ?? 0) + 1 }));
    setScoredThisRound((prev) => [...prev, name]);
  }

  function nextQuestion() {
    setScoredThisRound([]);
    if (current + 1 >= questions.length) {
      setScreen("result");
    } else {
      setCurrent((i) => i + 1);
      setScreen("quiz");
    }
  }

  const q = questions[current];
  const ranking = [...participants].sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-center text-lg font-extrabold text-brand-700">🔔 도전! 성경퀴즈 골든벨</h2>
        <p className="mt-1 text-center text-sm text-slate-400">
          {screen === "setup" ? "다 함께 모여 퀴즈를 풀어보세요!" : `범위: ${scope}`}
        </p>
      </section>

      {screen === "setup" && (
        <section className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm">
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

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-700">⭐ 퀴즈 난이도</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className={inputClass}
            >
              <option value="easy">쉬움 (어린이용)</option>
              <option value="normal">보통 (일반 성도용)</option>
              <option value="hard">어려움 (성경 퀴즈 대회용)</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
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
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-700">👥 참여자 수</span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_PEOPLE}
                value={names.length}
                onChange={(e) => setPeopleCount(Number(e.target.value))}
                className={`${inputClass} text-center`}
              />
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-700">👤 참여자 이름</span>
            <div className="grid grid-cols-2 gap-2">
              {names.map((name, i) => (
                <input
                  key={i}
                  value={name}
                  list="quiz-member-names"
                  onChange={(e) => setNames((prev) => prev.map((n, j) => (j === i ? e.target.value : n)))}
                  placeholder={`참여자 ${i + 1}`}
                  className={inputClass}
                />
              ))}
            </div>
            <datalist id="quiz-member-names">
              {members.map((m) => (
                <option key={m.id} value={m.name} />
              ))}
            </datalist>
          </div>

          <button
            onClick={startGame}
            className="rounded-xl bg-brand-600 py-3 text-base font-bold text-white shadow-sm hover:bg-brand-700"
          >
            게임 시작하기 🚀
          </button>
        </section>
      )}

      {screen === "loading" && (
        <section className="flex flex-col items-center gap-3 rounded-xl bg-white p-10 shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
          <p className="font-semibold text-slate-700">⏳ 퀴즈를 출제 중입니다...</p>
          <p className="text-sm text-slate-400">AI가 성경을 읽고 있어요! (10~20초 정도 걸려요)</p>
        </section>
      )}

      {screen === "quiz" && q && (
        <section className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm">
          <span className="self-center rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
            문제 {current + 1} / {questions.length}
          </span>
          <h3 className="break-keep text-center text-lg font-bold leading-snug text-slate-800">{q.question}</h3>
          <ol className="flex flex-col gap-2">
            {q.options.map((opt, i) => (
              <li key={i} className="rounded-xl border-2 border-slate-200 p-3 text-sm text-slate-700">
                <span className="mr-2 font-bold text-brand-600">{i + 1}.</span>
                {opt}
              </li>
            ))}
          </ol>
          <button
            onClick={() => setScreen("answer")}
            className="rounded-xl bg-amber-500 py-3 text-base font-bold text-white hover:bg-amber-600"
          >
            정답 확인하기 👀
          </button>
        </section>
      )}

      {screen === "answer" && q && (
        <section className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm">
          <h3 className="break-keep text-base font-bold leading-snug text-slate-800">{q.question}</h3>
          <ol className="flex flex-col gap-2">
            {q.options.map((opt, i) => {
              const correct = opt === q.answer;
              return (
                <li
                  key={i}
                  className={`flex items-center justify-between gap-2 rounded-xl border-2 p-3 text-sm ${
                    correct
                      ? "border-emerald-400 bg-emerald-50 font-bold text-emerald-800"
                      : "border-slate-200 text-slate-400"
                  }`}
                >
                  <span>
                    <span className="mr-2 font-bold text-brand-600">{i + 1}.</span>
                    {opt}
                  </span>
                  {correct && <span className="shrink-0 text-xs">정답 ✔️</span>}
                </li>
              );
            })}
          </ol>
          <div className="border-t-2 border-dashed border-slate-200 pt-3">
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
              💡 해설 및 성경 구절
            </span>
            <p className="mt-2 whitespace-pre-wrap break-keep text-sm text-slate-700">
              {q.explanation || "해설이 없습니다."}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="mb-3 text-center text-sm font-semibold text-slate-600">
              🏆 누가 맞췄나요? (정답자를 모두 선택하세요)
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {participants.map((name) => {
                const scored = scoredThisRound.includes(name);
                return (
                  <button
                    key={name}
                    onClick={() => givePoint(name)}
                    disabled={scored}
                    className={`rounded-full border-2 px-4 py-2 text-sm font-bold ${
                      scored
                        ? "border-brand-400 bg-brand-50 text-brand-700"
                        : "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    {scored ? `${name} (+1점) 🎉` : `${name} 정답!`}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={nextQuestion}
            className="rounded-xl bg-brand-600 py-3 text-base font-bold text-white hover:bg-brand-700"
          >
            {current + 1 >= questions.length ? "결과 보기 🏆" : "다음 문제로 넘어가기 ➡️"}
          </button>
        </section>
      )}

      {screen === "result" && (
        <section className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm">
          <h3 className="text-center text-xl font-extrabold text-amber-500">🎉 최종 결과 발표 🎉</h3>
          <ol className="flex flex-col gap-2">
            {ranking.map((name, i) => {
              const score = scores[name] ?? 0;
              const medal = score === 0 ? "😅" : (["🥇", "🥈", "🥉"][i] ?? "👏");
              const style =
                score === 0
                  ? "border-slate-200 bg-slate-50"
                  : (["border-amber-400 bg-amber-50", "border-slate-400 bg-slate-100", "border-orange-300 bg-orange-50"][i] ??
                    "border-slate-200 bg-slate-50");
              return (
                <li key={name} className={`flex items-center justify-between rounded-xl border-2 p-3 ${style}`}>
                  <span className="text-base">
                    <span className="mr-2 text-xl">{medal}</span>
                    {name}
                  </span>
                  <span className="text-lg font-bold text-slate-800">
                    {score}
                    <span className="ml-0.5 text-sm font-normal">점</span>
                  </span>
                </li>
              );
            })}
          </ol>
          <button
            onClick={() => setScreen("setup")}
            className="rounded-xl bg-brand-600 py-3 text-base font-bold text-white hover:bg-brand-700"
          >
            새 게임 시작하기 🔄
          </button>
        </section>
      )}
    </div>
  );
}
