import { useState } from "react";
import type { Member } from "../types";

interface Props {
  members: Member[];
  memberId: string;
  onMemberChange: (id: string) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
}

type Preset = "all" | "1w" | "2w" | "1m" | "custom";

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function rangeForPreset(preset: Exclude<Preset, "custom">): { start: string; end: string } {
  if (preset === "all") return { start: "", end: "" };

  const end = new Date();
  const start = new Date();
  if (preset === "1w") start.setDate(start.getDate() - 7);
  else if (preset === "2w") start.setDate(start.getDate() - 14);
  else if (preset === "1m") start.setMonth(start.getMonth() - 1);

  return { start: formatDate(start), end: formatDate(end) };
}

export function PrayerRequestFilters({
  members,
  memberId,
  onMemberChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
}: Props) {
  const [preset, setPreset] = useState<Preset>("all");
  const hasFilter = memberId || startDate || endDate;

  function handlePresetChange(next: Preset) {
    setPreset(next);
    if (next === "custom") return;
    const { start, end } = rangeForPreset(next);
    onStartDateChange(start);
    onEndDateChange(end);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 shadow-sm">
      <select
        value={memberId}
        onChange={(e) => onMemberChange(e.target.value)}
        className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
      >
        <option value="">전체 목원</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>

      <select
        value={preset}
        onChange={(e) => handlePresetChange(e.target.value as Preset)}
        className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
      >
        <option value="all">전체 기간</option>
        <option value="1w">최근 1주간</option>
        <option value="2w">최근 2주간</option>
        <option value="1m">최근 1달간</option>
        <option value="custom">날짜 직접 선택</option>
      </select>

      {preset === "custom" && (
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
          />
          <span className="text-slate-400">~</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
          />
        </div>
      )}

      {hasFilter && (
        <button
          onClick={() => {
            setPreset("all");
            onMemberChange("");
            onStartDateChange("");
            onEndDateChange("");
          }}
          className="text-sm text-slate-400 hover:text-slate-600"
        >
          초기화
        </button>
      )}
    </div>
  );
}
