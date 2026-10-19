import { useState, type FormEvent } from "react";
import { EMPTY_DRAFT, toPayload } from "../utils/meditation";
import { MeditationFields, type MeditationDraft, type MeditationPayload } from "./MeditationFields";

interface Props {
  onSubmit: (payload: MeditationPayload) => Promise<void>;
}

export function MeditationForm({ onSubmit }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<MeditationDraft>(EMPTY_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const payload = toPayload(draft);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!payload) return;

    setSubmitting(true);
    try {
      await onSubmit(payload);
      setDraft(EMPTY_DRAFT);
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <h2 className="shrink-0 text-sm font-bold text-blue-700">말씀 묵상</h2>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="flex-1 rounded-lg bg-slate-50 py-2 text-center text-sm font-medium text-brand-600 hover:bg-slate-100"
          >
            + 오늘의 말씀 기록
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <MeditationFields draft={draft} onChange={setDraft} />
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
              disabled={submitting || !payload}
              className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              저장
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
