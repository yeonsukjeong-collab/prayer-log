import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { Meditation } from "../types";
import { formatVerseRef } from "../utils/bible";
import { formatDateWithWeekday } from "../utils/date";
import { toDraft, toPayload } from "../utils/meditation";
import { MeditationFields, type MeditationDraft, type MeditationPayload } from "./MeditationFields";

interface Props {
  item: Meditation;
  onUpdate: (id: string, payload: MeditationPayload) => Promise<void>;
  onDelete: (id: string) => void;
}

export function MeditationItem({ item, onUpdate, onDelete }: Props) {
  const { user } = useAuth();
  const canManage = user?.id === item.author.id || user?.isLeader;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<MeditationDraft>(() => toDraft(item));
  const [saving, setSaving] = useState(false);
  const payload = toPayload(draft);

  const { dateLabel, weekdayLabel } = formatDateWithWeekday(new Date(item.createdAt));

  function startEditing() {
    setDraft(toDraft(item));
    setEditing(true);
  }

  async function handleSave() {
    if (!payload) return;
    setSaving(true);
    try {
      await onUpdate(item.id, payload);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="border-t border-slate-100 py-3 first:border-t-0 first:pt-0">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-blue-700">{formatVerseRef(item)}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {item.author.name} · {dateLabel} ({weekdayLabel})
          </p>
        </div>
        {canManage && !editing && (
          <div className="flex shrink-0 items-center gap-2 text-xs">
            <button onClick={startEditing} className="text-brand-600 hover:text-brand-700">
              수정
            </button>
            <button onClick={() => onDelete(item.id)} className="text-brand-600 hover:text-red-500">
              삭제
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
          <MeditationFields draft={draft} onChange={setDraft} />
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditing(false)} className="rounded-lg px-3 py-1.5 text-sm text-slate-500">
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !payload}
              className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              저장
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{item.content}</p>
      )}
    </li>
  );
}
