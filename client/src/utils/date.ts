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
