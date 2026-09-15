import { useMemo, useState } from "react";
import { parseBulkPrayerRequests } from "../utils/parseBulkPrayerRequests";
import type { Member } from "../types";

interface Props {
  members: Member[];
  onSubmit: (entries: { content: string; authorId: string }[]) => Promise<void>;
}

const PLACEHOLDER = `(이름)
- 기도제목1
- 기도제목2

(이름)
- 기도제목1
- 기도제목2`;

export function BulkPrayerRequestForm({ members, onSubmit }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [overrides, setOverrides] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const groups = useMemo(() => parseBulkPrayerRequests(text), [text]);

  const resolved = groups.map((g, i) => {
    const matchedId = members.find((m) => m.name === g.rawName)?.id;
    const authorId = overrides[i] ?? matchedId;
    return { ...g, authorId };
  });

  const totalItems = resolved.reduce((sum, g) => sum + g.items.length, 0);
  const hasUnresolved = resolved.some((g) => !g.authorId);

  function reset() {
    setText("");
    setOverrides({});
  }

  async function handleSubmit() {
    const entries = resolved
      .filter((g) => g.authorId)
      .map((g) => ({
        content: g.items.map((item) => `- ${item}`).join("\n"),
        authorId: g.authorId as string,
      }));
    if (entries.length === 0) return;

    setSubmitting(true);
    try {
      await onSubmit(entries);
      reset();
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
        + 여러 명 기도제목 한번에 붙여넣기
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-white p-3 shadow-sm">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={10}
        className="resize-none rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs focus:border-brand-400 focus:outline-none"
      />

      {groups.length > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-500">
            미리보기 · {resolved.length}명 · 항목 {totalItems}개 (각 사람당 기도제목 1건으로 등록됩니다)
          </p>
          {resolved.map((g, i) => (
            <div key={i} className="text-xs">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className={`font-semibold ${g.authorId ? "text-brand-700" : "text-red-500"}`}>
                  {g.rawName || "(이름 없음)"}
                </span>
                {!g.authorId && (
                  <select
                    value={overrides[i] ?? ""}
                    onChange={(e) => setOverrides((prev) => ({ ...prev, [i]: e.target.value }))}
                    className="rounded border border-red-300 px-1 py-0.5 text-xs text-red-600"
                  >
                    <option value="">누구인지 선택하세요</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                )}
                <span className="text-slate-400">{g.items.length}건</span>
              </div>
              <ul className="ml-4 list-disc space-y-0.5 text-slate-600">
                {g.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            reset();
          }}
          className="rounded-lg px-3 py-1.5 text-sm text-slate-500"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || resolved.length === 0 || hasUnresolved}
          className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {resolved.length > 0 ? `${resolved.length}명 기도제목 등록` : "등록"}
        </button>
      </div>
    </div>
  );
}
