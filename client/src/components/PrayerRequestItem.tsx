import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { PrayerRequest } from "../types";

interface Props {
  item: PrayerRequest;
  onToggleAnswered: (id: string, isAnswered: boolean, answeredNote?: string | null) => void;
  onDelete: (id: string) => void;
}

export function PrayerRequestItem({ item, onToggleAnswered, onDelete }: Props) {
  const { user } = useAuth();
  const canManage = user?.id === item.author.id || user?.isLeader;
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState(item.answeredNote ?? "");

  const createdAt = new Date(item.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <li
      className={`rounded-xl border p-4 shadow-sm transition ${
        item.isAnswered ? "border-brand-100 bg-brand-50/60" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className={`whitespace-pre-wrap text-sm ${item.isAnswered ? "text-slate-500 line-through decoration-brand-400" : "text-slate-800"}`}>
            {item.content}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            {item.author.name} · {createdAt}
          </p>
          {item.isAnswered && item.answeredNote && (
            <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-brand-700">
              🙏 {item.answeredNote}
            </p>
          )}
        </div>
        {canManage && (
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={() => {
                if (item.isAnswered) {
                  onToggleAnswered(item.id, false, null);
                  setShowNoteInput(false);
                } else {
                  setShowNoteInput((v) => !v);
                }
              }}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                item.isAnswered
                  ? "bg-brand-600 text-white"
                  : "border border-brand-300 text-brand-600 hover:bg-brand-50"
              }`}
            >
              {item.isAnswered ? "응답됨" : "응답 표시"}
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="text-xs text-slate-400 hover:text-red-500"
            >
              삭제
            </button>
          </div>
        )}
      </div>
      {showNoteInput && !item.isAnswered && (
        <div className="mt-3 flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="응답 내용을 간단히 적어주세요 (선택)"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
          />
          <button
            onClick={() => {
              onToggleAnswered(item.id, true, note || null);
              setShowNoteInput(false);
            }}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white"
          >
            확인
          </button>
        </div>
      )}
    </li>
  );
}
