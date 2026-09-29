import type { PeriodPreset } from "../utils/date";
import type { Member } from "../types";

interface Props {
  members: Member[];
  memberId: string;
  onMemberChange: (id: string) => void;
  preset: PeriodPreset;
  onPresetChange: (preset: PeriodPreset) => void;
  customStartDate: string;
  onCustomStartDateChange: (value: string) => void;
  customEndDate: string;
  onCustomEndDateChange: (value: string) => void;
  onExport?: () => void;
}

export function MemberPeriodFilters({
  members,
  memberId,
  onMemberChange,
  preset,
  onPresetChange,
  customStartDate,
  onCustomStartDateChange,
  customEndDate,
  onCustomEndDateChange,
  onExport,
}: Props) {
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
        onChange={(e) => onPresetChange(e.target.value as PeriodPreset)}
        className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
      >
        <option value="1w">최근 1주간</option>
        <option value="2w">최근 2주간</option>
        <option value="1m">최근 1달간</option>
        <option value="all">전체 기간</option>
        <option value="custom">날짜 직접 선택</option>
      </select>

      {preset === "custom" && (
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => onCustomStartDateChange(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
          />
          <span className="text-slate-400">~</span>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => onCustomEndDateChange(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
          />
        </div>
      )}

      {onExport && (
        <button
          onClick={onExport}
          className="ml-auto rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
        >
          📊 다운로드
        </button>
      )}
    </div>
  );
}
