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
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
