import { useFontScale } from "../hooks/useFontScale";

export function FontSizeControl() {
  const { canDecrease, canIncrease, decrease, increase } = useFontScale();

  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1 py-1">
      <button
        onClick={decrease}
        disabled={!canDecrease}
        aria-label="글자 크기 줄이기"
        className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30"
      >
        가-
      </button>
      <button
        onClick={increase}
        disabled={!canIncrease}
        aria-label="글자 크기 키우기"
        className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30"
      >
        가+
      </button>
    </div>
  );
}
