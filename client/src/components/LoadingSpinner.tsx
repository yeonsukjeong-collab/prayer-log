import { useEffect, useState } from "react";

interface Props {
  label?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ label = "불러오는 중", fullScreen = false }: Props) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      // 시간이 지날수록 100%에 점점 가까워지지만 실제로 끝나기 전까지는 닿지 않습니다.
      setProgress(99 * (1 - Math.exp(-elapsed / 600)));
    }, 80);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-slate-400 ${
        fullScreen ? "min-h-screen" : "py-10"
      }`}
    >
      <div className="h-1.5 w-40 max-w-[60vw] overflow-hidden rounded-full bg-brand-100">
        <div
          className="h-full rounded-full bg-brand-600 transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm">
        {label} {Math.round(progress)}%
      </p>
    </div>
  );
}
