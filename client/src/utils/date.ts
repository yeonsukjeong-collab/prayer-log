export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDateWithWeekday(date: Date): { dateLabel: string; weekdayLabel: string } {
  const dateLabel = date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const weekdayLabel = date.toLocaleDateString("ko-KR", { weekday: "short" });
  return { dateLabel, weekdayLabel };
}

export type PeriodPreset = "all" | "1w" | "2w" | "1m" | "custom";

export function rangeForPreset(preset: Exclude<PeriodPreset, "custom">): { start: string; end: string } {
  if (preset === "all") return { start: "", end: "" };

  const end = new Date();
  const start = new Date();
  if (preset === "1w") start.setDate(start.getDate() - 7);
  else if (preset === "2w") start.setDate(start.getDate() - 14);
  else if (preset === "1m") start.setMonth(start.getMonth() - 1);

  return { start: toDateInputValue(start), end: toDateInputValue(end) };
}
