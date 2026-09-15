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

export function PrayerRequestFilters({
  members,
  memberId,
  onMemberChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
}: Props) {
  const hasFilter = memberId || startDate || endDate;

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

      {hasFilter && (
        <button
          onClick={() => {
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
