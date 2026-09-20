import { useState, type FormEvent } from "react";
import { toDateInputValue } from "../utils/date";

interface Props {
  onSubmit: (content: string, prayerDate?: string) => Promise<void>;
}

export function PastorPrayerForm({ onSubmit }: Props) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [prayerDate, setPrayerDate] = useState(() => toDateInputValue(new Date()));
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit(content.trim(), prayerDate || undefined);
      setContent("");
      setPrayerDate(toDateInputValue(new Date()));
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-white p-3 text-center text-sm font-medium text-brand-600 shadow-sm hover:bg-brand-50"
      >
        + 새 기도문 작성
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-xl bg-white p-3 shadow-sm">
      <input
        type="date"
        value={prayerDate}
        onChange={(e) => setPrayerDate(e.target.value)}
        className="self-start rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="윤만선 목사님 기도문을 입력하세요"
        rows={6}
        className="resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-3 py-1.5 text-sm text-slate-500"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          저장
        </button>
      </div>
    </form>
  );
}
