import { chapterUnit, NEW_TESTAMENT, OLD_TESTAMENT } from "../utils/bible";
import { RichTextEditor } from "./RichTextEditor";

export interface MeditationDraft {
  book: string;
  chapter: string;
  verseStart: string;
  verseEnd: string;
  content: string;
}

export interface MeditationPayload {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number | null;
  content: string;
}

const inputClass =
  "rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none";

interface Props {
  draft: MeditationDraft;
  onChange: (draft: MeditationDraft) => void;
}

export function MeditationFields({ draft, onChange }: Props) {
  function set<K extends keyof MeditationDraft>(key: K, value: MeditationDraft[K]) {
    onChange({ ...draft, [key]: value });
  }

  const invalidRange =
    draft.verseEnd !== "" && draft.verseStart !== "" && Number(draft.verseEnd) < Number(draft.verseStart);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5 text-sm text-slate-600">
        <select value={draft.book} onChange={(e) => set("book", e.target.value)} className={inputClass}>
          <option value="">말씀서 선택</option>
          <optgroup label="구약">
            {OLD_TESTAMENT.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </optgroup>
          <optgroup label="신약">
            {NEW_TESTAMENT.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </optgroup>
        </select>
        <span className="flex items-center gap-1">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={draft.chapter}
            onChange={(e) => set("chapter", e.target.value)}
            className={`${inputClass} w-16`}
          />
          {chapterUnit(draft.book)}
        </span>
        <span className="flex items-center gap-1">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={draft.verseStart}
            onChange={(e) => set("verseStart", e.target.value)}
            className={`${inputClass} w-16`}
          />
          절
        </span>
        <span className="flex items-center gap-1">
          ~
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={draft.verseEnd}
            onChange={(e) => set("verseEnd", e.target.value)}
            placeholder="선택"
            className={`${inputClass} w-16`}
          />
          절
        </span>
      </div>
      {invalidRange && <p className="text-xs text-red-500">끝 절은 시작 절보다 같거나 커야 해요.</p>}
      <RichTextEditor
        initialHtml={draft.content}
        onChange={(html) => set("content", html)}
        placeholder="말씀을 입력하세요. 글자를 선택한 뒤 위 버튼으로 굵게·색을 바꿀 수 있어요."
      />
    </div>
  );
}
