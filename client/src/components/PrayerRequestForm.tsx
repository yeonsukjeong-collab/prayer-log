import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import type { Member } from "../types";

interface Props {
  members: Member[];
  onSubmit: (content: string, authorId?: string) => Promise<void>;
}

export function PrayerRequestForm({ members, onSubmit }: Props) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [authorId, setAuthorId] = useState(user?.id ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      await onSubmit(trimmed, authorId || undefined);
      setContent("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-xl bg-white p-3 shadow-sm">
      {members.length > 0 && (
        <select
          value={authorId}
          onChange={(e) => setAuthorId(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      )}
      <div className="flex gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="기도제목을 나눠주세요"
          rows={2}
          className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          등록
        </button>
      </div>
    </form>
  );
}
