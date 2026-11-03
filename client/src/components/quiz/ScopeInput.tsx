import { BibleBookOptions } from "../BibleBookOptions";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

/** 출제 범위를 문장으로 쓰거나, 오른쪽 버튼으로 성경 목록에서 한 권을 고를 수 있는 입력칸입니다. */
export function ScopeInput({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-slate-700">📖 출제 범위</span>
      <div className="flex gap-1.5">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={50}
          placeholder="예: 창세기, 다윗의 생애, 예수님의 비유"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
        />
        {/* 버튼 모양 위에 투명한 <select>를 겹쳐, 누르면 휴대폰 기본 목록이 뜨게 합니다. */}
        <label className="relative flex shrink-0 cursor-pointer items-center rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 hover:border-brand-300 hover:text-brand-700">
          성경 목록 ▾
          <select
            value=""
            onChange={(e) => e.target.value && onChange(e.target.value)}
            aria-label="성경 목록에서 고르기"
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            <option value="">말씀서 선택</option>
            <BibleBookOptions />
          </select>
        </label>
      </div>
    </div>
  );
}
