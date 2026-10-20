import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import type { Praise } from "../types";

export function PraiseCard() {
  const [praise, setPraise] = useState<Praise | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .get<{ item: Praise }>("/praise")
      .then((res) => setPraise(res.item))
      .catch(() => setPraise(null))
      .finally(() => setLoading(false));
  }, []);

  // 아이폰 사파리처럼 화면 요소의 전체화면을 지원하지 않는 브라우저에서는 버튼을 숨기고,
  // 유튜브 플레이어 자체의 전체화면 버튼을 쓰도록 합니다.
  const canFullscreen = typeof document !== "undefined" && document.fullscreenEnabled;

  function openFullscreen() {
    playerRef.current?.requestFullscreen().catch(() => {});
  }

  return (
    <section className="rounded-xl bg-white p-3 shadow-sm">
      <h2 className="text-sm font-bold text-blue-700">오늘의 찬양</h2>

      {loading ? (
        <p className="mt-2 text-sm text-slate-400">불러오는 중...</p>
      ) : !praise ? (
        <p className="mt-2 text-sm text-slate-400">오늘의 찬양을 불러오지 못했어요.</p>
      ) : (
        <>
          <div ref={playerRef} className="relative mt-2 aspect-video w-full overflow-hidden rounded-lg bg-black">
            {playing ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${praise.videoId}?autoplay=1&playsinline=1&rel=0`}
                title={praise.videoTitle}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            ) : (
              <button
                onClick={() => setPlaying(true)}
                className="group absolute inset-0 h-full w-full"
                aria-label={`${praise.songTitle} 재생`}
              >
                <img
                  src={`https://i.ytimg.com/vi/${praise.videoId}/hqdefault.jpg`}
                  alt={praise.videoTitle}
                  className="h-full w-full object-cover"
                />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-12 w-16 items-center justify-center rounded-xl bg-red-600/90 text-2xl text-white shadow-lg transition group-hover:bg-red-600">
                    ▶
                  </span>
                </span>
              </button>
            )}
          </div>

          <div className="mt-2 flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-slate-800">{praise.songTitle}</p>
            {playing && canFullscreen && (
              <button
                onClick={openFullscreen}
                className="shrink-0 rounded-lg bg-slate-50 px-2 py-1 text-xs font-medium text-brand-600 hover:bg-slate-100"
              >
                ⛶ 전체화면
              </button>
            )}
          </div>
          <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{praise.videoTitle}</p>
        </>
      )}
    </section>
  );
}
