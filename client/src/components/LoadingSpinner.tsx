interface Props {
  label?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ label = "불러오는 중...", fullScreen = false }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-slate-400 ${
        fullScreen ? "min-h-screen" : "py-10"
      }`}
    >
      <div className="h-1.5 w-40 max-w-[60vw] overflow-hidden rounded-full bg-brand-100">
        <div className="h-full w-1/3 animate-progress-indeterminate rounded-full bg-brand-600" />
      </div>
      <p className="text-sm">{label}</p>
    </div>
  );
}
