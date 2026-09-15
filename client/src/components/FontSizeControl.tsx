import { useFontScale } from "../hooks/useFontScale";

export function FontSizeControl() {
  const { canDecrease, canIncrease, decrease, increase } = useFontScale();

  return (
    <>
      <button
        onClick={decrease}
        disabled={!canDecrease}
        aria-label="글자 크기 줄이기"
        title="글자 크기 줄이기"
        className="rounded-full bg-white/80 px-3 py-1.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-white disabled:opacity-30"
      >
        가-
      </button>
      <button
        onClick={increase}
        disabled={!canIncrease}
        aria-label="글자 크기 키우기"
        title="글자 크기 키우기"
        className="rounded-full bg-white/80 px-3 py-1.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-white disabled:opacity-30"
      >
        가+
      </button>
    </>
  );
}
