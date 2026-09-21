import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { Benediction } from "../types";
import { formatDateWithWeekday } from "../utils/date";

interface Props {
  benediction: Benediction | null;
  onSave: (content: string) => Promise<void>;
}

export function BenedictionCard({ benediction, onSave }: Props) {
  const { user } = useAuth();
  const canEdit = Boolean(user?.isAdmin || user?.isLeader);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(benediction?.content ?? "");
  const [saving, setSaving] = useState(false);

  function startEditing() {
    setContent(benediction?.content ?? "");
    setEditing(true);
  }

  async function handleSave() {
    const trimmed = content.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onSave(trimmed);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-blue-700">축도</h2>
        {canEdit && !editing && (
          <button onClick={startEditing} className="text-xs text-slate-500 hover:text-brand-600">
            수정
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="매주 동일하게 주시는 축도 내용을 입력하세요"
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
              disabled={saving || !content.trim()}
              className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              저장
            </button>
          </div>
        </div>
      ) : benediction ? (
        <>
          <p className="mt-2 whitespace-pre-wrap text-sm font-bold text-slate-800">{benediction.content}</p>
          <p className="mt-2 text-xs text-slate-400">
            {benediction.updatedBy.name} · 최근 수정{" "}
            {(() => {
              const { dateLabel, weekdayLabel } = formatDateWithWeekday(new Date(benediction.updatedAt));
              return `${dateLabel} (${weekdayLabel})`;
            })()}
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-slate-400">
          {canEdit ? "아직 등록된 축도가 없어요. 수정을 눌러 등록해주세요." : "아직 등록된 축도가 없어요."}
        </p>
      )}
    </section>
  );
}
