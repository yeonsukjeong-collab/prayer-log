import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { PhotoDetail, PhotoSummary } from "../types";
import { formatDateWithWeekday } from "../utils/date";

interface Props {
  photo: PhotoSummary;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function PhotoViewerModal({ photo, onClose, onDelete }: Props) {
  const { user } = useAuth();
  const [detail, setDetail] = useState<PhotoDetail | null>(null);
  const canManage = user?.id === photo.author.id || user?.isLeader;

  useEffect(() => {
    api.get<{ item: PhotoDetail }>(`/photos/${photo.id}`).then((res) => setDetail(res.item));
  }, [photo.id]);

  const { dateLabel, weekdayLabel } = formatDateWithWeekday(new Date(photo.photoDate));

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-bold text-blue-700">
            {photo.author.name} · {dateLabel} ({weekdayLabel})
          </p>
          <div className="flex items-center gap-3 text-xs">
            {canManage && (
              <button
                onClick={() => onDelete(photo.id)}
                className="text-slate-400 hover:text-red-500"
              >
                삭제
              </button>
            )}
            <button onClick={onClose} className="text-lg text-slate-400 hover:text-slate-600">
              ✕
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-slate-100">
          {detail ? (
            <img src={detail.imageData} alt={photo.caption ?? "사진"} className="w-full" />
          ) : (
            <img src={photo.thumbnailData} alt={photo.caption ?? "사진"} className="w-full opacity-60" />
          )}
        </div>
        {photo.caption && (
          <p className="border-t border-slate-100 px-4 py-3 text-sm text-slate-700">{photo.caption}</p>
        )}
      </div>
    </div>
  );
}
