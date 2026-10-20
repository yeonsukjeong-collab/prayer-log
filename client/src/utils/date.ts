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

/**
 * "YYYY-MM-DD" 기간을 현지 시간 기준 [startAt, endBefore) 시각(ISO)으로 바꿉니다.
 * 작성 시각처럼 시각까지 저장된 값을 현지 날짜로 거를 때 씁니다.
 */
export function localDayBounds(start: string, end: string): { startAt?: string; endBefore?: string } {
  const toLocalMidnight = (value: string, addDays = 0) => {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d + addDays).toISOString();
  };
  return {
    ...(start ? { startAt: toLocalMidnight(start) } : {}),
    ...(end ? { endBefore: toLocalMidnight(end, 1) } : {}),
  };
}

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  all: "전체기간",
  "1w": "최근1주간",
  "2w": "최근2주간",
  "1m": "최근1달간",
  custom: "기간지정",
};
