export interface ParsedGroup {
  rawName: string;
  items: string[];
}

/**
 * Parses pasted text like:
 * (정연석)
 * - 기도제목1
 * - 기도제목2 (줄바꿈으로
 *   이어지는 내용)
 *
 * (김선경)
 * - 기도제목1
 *
 * A line not starting with a bullet marker is treated as a continuation
 * of the previous bullet (wrapped text), since long items are often
 * pasted with soft line breaks.
 */
export function parseBulkPrayerRequests(text: string): ParsedGroup[] {
  const lines = text.split(/\r?\n/);
  const groups: ParsedGroup[] = [];
  let current: ParsedGroup | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const headerMatch = line.match(/^\((.+)\)$/);
    if (headerMatch) {
      current = { rawName: headerMatch[1].trim(), items: [] };
      groups.push(current);
      continue;
    }

    const bulletMatch = line.match(/^[-•*]\s*(.*)$/);
    if (bulletMatch) {
      if (!current) {
        current = { rawName: "", items: [] };
        groups.push(current);
      }
      current.items.push(bulletMatch[1].trim());
      continue;
    }

    if (current && current.items.length > 0) {
      const lastIndex = current.items.length - 1;
      current.items[lastIndex] = `${current.items[lastIndex]} ${line}`.trim();
    }
  }

  return groups.filter((g) => g.items.length > 0);
}
