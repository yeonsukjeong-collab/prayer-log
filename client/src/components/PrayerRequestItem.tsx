import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { PrayerRequest } from "../types";
import { formatDateWithWeekday, toDateInputValue } from "../utils/date";

interface Props {
  item: PrayerRequest;
  onUpdate: (
    id: string,
    data: { content?: string; requestDate?: string; isAnswered?: boolean; answeredNote?: string | null },
  ) => Promise<void>;
  onDelete: (id: string) => void;
}

function PrayerContent({ content, isAnswered }: { content: string; isAnswered: boolean }) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const isBulletList = lines.length > 0 && lines.every((line) => line.startsWith("-"));
  const textClass = isAnswered ? "text-slate-500 line-through decoration-brand-400" : "text-slate-800";

  if (isBulletList) {
    return (
      <ul className={`list-outside list-disc space-y-1 pl-5 text-sm ${textClass}`}>
        {lines.map((line, i) => (
          <li key={i} className="whitespace-pre-wrap">
            {line.replace(/^-\s*/, "")}
          </li>
        ))}
      </ul>
    );
  }

  return <p className={`whitespace-pre-wrap text-sm ${textClass}`}>{content}</p>;
}

export function PrayerRequestItem({ item, onUpdate, onDelete }: Props) {
  const { user } = useAuth();
  const canManage = user?.id === item.author.id || user?.isLeader;

  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content);
  const [editDate, setEditDate] = useState(() => toDateInputValue(new Date(item.requestDate)));
  const [editAnswered, setEditAnswered] = useState(item.isAnswered);
  const [editNote, setEditNote] = useState(item.answeredNote ?? "");
  const [saving, setSaving] = useState(false);

  const { dateLabel, weekdayLabel } = formatDateWithWeekday(new Date(item.requestDate));

  function startEditing() {
    setEditContent(item.content);
    setEditDate(toDateInputValue(new Date(item.requestDate)));
    setEditAnswered(item.isAnswered);
    setEditNote(item.answeredNote ?? "");
    setEditing(true);
  }

  async function handleSave() {
    const trimmed = editContent.trim();
    if (!trimmed || !editDate) return;

    setSaving(true);
    try {
      await onUpdate(item.id, {
        content: trimmed,
        requestDate: editDate,
        isAnswered: editAnswered,
        answeredNote: editAnswered ? editNote.trim() || null : null,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <li
      className={`rounded-xl border p-4 shadow-sm transition ${
        item.isAnswered ? "border-brand-100 bg-brand-50/60" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-blue-700">
          {item.author.name} · {dateLabel} ({weekdayLabel})
        </p>
        {canManage && !editing && (
          <div className="flex shrink-0 gap-2 text-xs">
            <button onClick={startEditing} className="text-slate-500 hover:text-brand-600">
              수정
            </button>
            <button onClick={() => onDelete(item.id)} className="text-slate-400 hover:text-red-500">
              삭제
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="mt-2 flex flex-col gap-2">
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            className="self-start rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            className="resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
          />
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={editAnswered}
              onChange={(e) => setEditAnswered(e.target.checked)}
            />
            응답됨으로 표시
          </label>
          {editAnswered && (
            <input
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="응답 내용을 간단히 적어주세요 (선택)"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
            />
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg px-3 py-1.5 text-sm text-slate-500"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !editContent.trim() || !editDate}
              className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              저장
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-2">
            <PrayerContent content={item.content} isAnswered={item.isAnswered} />
          </div>
          {item.isAnswered && item.answeredNote && (
            <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-brand-700">
              🙏 {item.answeredNote}
            </p>
          )}
        </>
      )}
    </li>
  );
}
