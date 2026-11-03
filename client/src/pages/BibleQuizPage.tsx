import { useState } from "react";
import { LiveQuiz } from "../components/quiz/LiveQuiz";
import { LocalQuiz } from "../components/quiz/LocalQuiz";

type Mode = "live" | "local";

export function BibleQuizPage() {
  const [mode, setMode] = useState<Mode>("live");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-center text-lg font-extrabold text-brand-700">🔔 도전! 성경퀴즈 골든벨</h2>
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
          {(
            [
              ["live", "📱 다 함께 풀기"],
              ["local", "🖥️ 한 화면에서 풀기"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={`rounded-lg py-2 transition ${
                mode === value ? "bg-white text-brand-700 shadow-sm" : "text-slate-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-slate-400">
          {mode === "live"
            ? "각자 휴대폰으로 같은 문제를 동시에 풀고 점수를 자동으로 모아요."
            : "한 기기를 함께 보며 풀고, 맞힌 사람을 골라 점수를 매겨요."}
        </p>
      </section>

      {mode === "live" ? <LiveQuiz /> : <LocalQuiz />}
    </div>
  );
}
