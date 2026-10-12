import { useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { LoadingSpinner } from "./LoadingSpinner";
import type { Bulletin } from "../types";

export function BulletinCard() {
  const [bulletin, setBulletin] = useState<Bulletin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get<{ item: Bulletin }>("/bulletin/latest")
      .then((res) => setBulletin(res.item))
      .catch((err) => {
        if (!(err instanceof ApiError)) console.error(err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="rounded-xl bg-white p-3 shadow-sm">
      <h2 className="text-sm font-bold text-blue-700">주보</h2>

      {loading ? (
        <LoadingSpinner />
      ) : error || !bulletin ? (
        <p className="mt-2 text-sm text-slate-400">
          주보를 불러오지 못했어요.{" "}
          <a
            href="http://www.osmcc.or.kr/main/sub.html?pageCode=55"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 hover:underline"
          >
            교회 홈페이지에서 보기
          </a>
        </p>
      ) : (
        <>
          <a
            href={bulletin.detailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center gap-3"
          >
            {bulletin.thumbnailDataUrl && (
              <img
                src={bulletin.thumbnailDataUrl}
                alt={bulletin.title}
                className="h-20 w-20 shrink-0 rounded-lg object-cover"
              />
            )}
            <span className="flex-1 text-sm font-bold text-slate-800">{bulletin.title}</span>
            <span className="shrink-0 text-xs text-brand-600">원본보기 ›</span>
          </a>

          {bulletin.pastoralLetterDataUrl && (
            <div className="mt-3 border-t border-slate-100 pt-3">
              <h3 className="text-sm font-bold text-blue-700">목회 편지</h3>
              <img
                src={bulletin.pastoralLetterDataUrl}
                alt="목회 편지"
                className="mt-2 w-full rounded-lg border border-slate-100"
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}
