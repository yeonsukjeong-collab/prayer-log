import { useEffect, useState } from "react";

// 이보다 오래 걸리면 Render 서버가 잠에서 깨어나는 중일 가능성이 높습니다.
const SLOW_THRESHOLD_MS = 5000;

interface Props {
  label?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ label = "불러오는 중", fullScreen = false }: Props) {
  const [progress, setProgress] = useState(0);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      // 시간이 지날수록 100%에 점점 가까워지지만 실제로 끝나기 전까지는 닿지 않습니다.
      // 평소 요청은 1~2초면 끝나므로 처음 70%는 빠르게 채우고, 나머지 29%는
      // Render 무료 플랜 서버가 잠에서 깨어나는 시간(30초~1분)에 맞춰 천천히 채웁니다.
      setProgress(
        70 * (1 - Math.exp(-elapsed / 600)) + 29 * (1 - Math.exp(-elapsed / 20000))
      );
      setSlow(elapsed > SLOW_THRESHOLD_MS);
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
      {slow && (
        <p className="px-4 text-center text-xs">
          쉬고 있던 서버를 깨우는 중이에요.
          <br />
          처음 접속할 때는 최대 1분 정도 걸릴 수 있어요.
        </p>
      )}
    </div>
  );
}
