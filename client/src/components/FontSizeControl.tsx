import { useFontScale } from "../hooks/useFontScale";

export function FontSizeControl() {
  const { canDecrease, canIncrease, decrease, increase } = useFontScale();

  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1 py-1">
      <button
        onClick={decrease}
        disabled={!canDecrease}
        aria-label="글자 크기 줄이기"
        title="글자 크기 줄이기"
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-30"
      >
        <span aria-hidden className="font-bold leading-none" style={{ fontSize: "11px" }}>
          가
        </span>
      </button>
      <div className="h-4 w-px bg-slate-200" />
      <button
        onClick={increase}
        disabled={!canIncrease}
        aria-label="글자 크기 키우기"
        title="글자 크기 키우기"
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-30"
      >
        <span aria-hidden className="font-bold leading-none" style={{ fontSize: "18px" }}>
          가
        </span>
      </button>
    </div>
  );
}
