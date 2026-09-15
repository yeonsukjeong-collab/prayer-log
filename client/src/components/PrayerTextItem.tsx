import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { PrayerText } from "../types";
import { formatDateWithWeekday, toDateInputValue } from "../utils/date";

interface Props {
  item: PrayerText;
  onUpdate: (id: string, data: { content?: string; meetingDate?: string }) => Promise<void>;
  onDelete: (id: string) => void;
}

export function PrayerTextItem({ item, onUpdate, onDelete }: Props) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content);
  const [editDate, setEditDate] = useState(() => toDateInputValue(new Date(item.meetingDate)));
  const [saving, setSaving] = useState(false);
  const isOwner = user?.id === item.author.id;

  const { dateLabel, weekdayLabel } = formatDateWithWeekday(new Date(item.meetingDate));

  function startEditing() {
    setEditContent(item.content);
    setEditDate(toDateInputValue(new Date(item.meetingDate)));
    setEditing(true);
    setExpanded(true);
  }

  async function handleSave() {
    const trimmed = editContent.trim();
    if (!trimmed || !editDate) return;

    setSaving(true);
    try {
      await onUpdate(item.id, { content: trimmed, meetingDate: editDate });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <button
          className="flex-1 text-left"
          onClick={() => setExpanded((v) => !v)}
          disabled={editing}
        >
          <p className="text-sm font-bold text-blue-700">
            {item.author.name} · {dateLabel} ({weekdayLabel})
          </p>
        </button>
        <div className="flex shrink-0 items-center gap-2 text-xs">
          {isOwner && !editing && (
            <>
              <button onClick={startEditing} className="text-slate-500 hover:text-brand-600">
                수정
              </button>
              <button onClick={() => onDelete(item.id)} className="text-slate-400 hover:text-red-500">
                삭제
              </button>
            </>
          )}
          {!editing && (
            <span className="text-slate-400" onClick={() => setExpanded((v) => !v)}>
              {expanded ? "▲" : "▼"}
            </span>
          )}
        </div>
      </div>

      {editing ? (
        <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            className="self-start rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={6}
            className="resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
          />
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
        expanded && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="whitespace-pre-wrap text-sm text-slate-700">{item.content}</p>
          </div>
        )
      )}
    </li>
  );
}
