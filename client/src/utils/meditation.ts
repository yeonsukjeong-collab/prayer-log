import type { MeditationDraft, MeditationPayload } from "../components/MeditationFields";
import type { Meditation } from "../types";

export const EMPTY_DRAFT: MeditationDraft = {
  book: "",
  chapter: "",
  verseStart: "",
  verseEnd: "",
  content: "",
};

export function toDraft(item: Meditation): MeditationDraft {
  return {
    book: item.book,
    chapter: String(item.chapter),
    verseStart: String(item.verseStart),
    verseEnd: item.verseEnd ? String(item.verseEnd) : "",
    content: item.content,
  };
}

/** Converts the form's text inputs into the API payload, or null if incomplete/invalid. */
export function toPayload(draft: MeditationDraft): MeditationPayload | null {
  const chapter = Number(draft.chapter);
  const verseStart = Number(draft.verseStart);
  const verseEnd = draft.verseEnd ? Number(draft.verseEnd) : null;
  const content = draft.content.trim();

  if (!draft.book || !content) return null;
  if (!Number.isInteger(chapter) || chapter < 1) return null;
  if (!Number.isInteger(verseStart) || verseStart < 1) return null;
  if (verseEnd !== null && (!Number.isInteger(verseEnd) || verseEnd < verseStart)) return null;

  return { book: draft.book, chapter, verseStart, verseEnd, content };
}
