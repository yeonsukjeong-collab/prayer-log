import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { PhotoComment, PhotoDetail, PhotoSummary } from "../types";
import { formatDateWithWeekday } from "../utils/date";

interface Props {
  photo: PhotoSummary;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function PhotoViewerModal({ photo, onClose, onDelete }: Props) {
  const { user } = useAuth();
  const [detail, setDetail] = useState<PhotoDetail | null>(null);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const canManage = user?.id === photo.author.id || user?.isLeader;

  useEffect(() => {
    api.get<{ item: PhotoDetail }>(`/photos/${photo.id}`).then((res) => setDetail(res.item));
  }, [photo.id]);

  const { dateLabel, weekdayLabel } = formatDateWithWeekday(new Date(photo.photoDate));
  const fileDate = photo.photoDate.slice(0, 10);
  const downloadName = `${photo.author.name}_${fileDate}.jpg`;

  async function handleAddComment(e: FormEvent) {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) return;

    setPosting(true);
    try {
      const res = await api.post<{ comment: PhotoComment }>(`/photos/${photo.id}/comments`, {
        content: trimmed,
      });
      setDetail((prev) => (prev ? { ...prev, comments: [...prev.comments, res.comment] } : prev));
      setCommentText("");
    } finally {
      setPosting(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("이 댓글을 삭제할까요?")) return;
    await api.delete(`/photos/${photo.id}/comments/${commentId}`);
    setDetail((prev) =>
      prev ? { ...prev, comments: prev.comments.filter((c) => c.id !== commentId) } : prev,
    );
  }

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
            {detail ? (
              <a
                href={detail.imageData}
                download={downloadName}
                className="text-slate-400 hover:text-brand-600"
              >
                다운로드
              </a>
            ) : (
              <span className="text-slate-300">다운로드</span>
            )}
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

        <div className="flex-1 overflow-y-auto">
          <div className="bg-slate-100">
            {detail ? (
              <img src={detail.imageData} alt={photo.caption ?? "사진"} className="w-full" />
            ) : (
              <img src={photo.thumbnailData} alt={photo.caption ?? "사진"} className="w-full opacity-60" />
            )}
          </div>
          {photo.caption && (
            <p className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">{photo.caption}</p>
          )}

          <div className="flex flex-col gap-3 px-4 py-3">
            {!detail ? (
              <p className="text-center text-xs text-slate-400">댓글 불러오는 중...</p>
            ) : detail.comments.length === 0 ? (
              <p className="text-center text-xs text-slate-400">아직 댓글이 없어요.</p>
            ) : (
              detail.comments.map((comment) => {
                const canDeleteComment = user?.id === comment.author.id || user?.isLeader;
                return (
                  <div key={comment.id} className="flex items-start justify-between gap-2">
                    <p className="text-sm text-slate-700">
                      <span className="font-bold text-slate-800">{comment.author.name}</span>{" "}
                      {comment.content}
                    </p>
                    {canDeleteComment && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="shrink-0 text-xs text-slate-300 hover:text-red-500"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <form
          onSubmit={handleAddComment}
          className="flex items-center gap-2 border-t border-slate-100 px-4 py-3"
        >
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="댓글을 입력하세요"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={posting || !commentText.trim()}
            className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            등록
          </button>
        </form>
      </div>
    </div>
  );
}
