import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import type { AccessLogSummary } from "../types";
import { rangeForPreset, type PeriodPreset } from "../utils/date";

interface Props {
  onClose: () => void;
}

export function AccessLogModal({ onClose }: Props) {
  const [items, setItems] = useState<AccessLogSummary[] | null>(null);
  const [preset, setPreset] = useState<PeriodPreset>("1w");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const { start: rangeStart, end: rangeEnd } = useMemo(() => {
    if (preset === "custom") return { start: customStartDate, end: customEndDate };
    return rangeForPreset(preset);
  }, [preset, customStartDate, customEndDate]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (rangeStart) params.set("startDate", rangeStart);
    if (rangeEnd) params.set("endDate", rangeEnd);
    const query = params.toString();

    let cancelled = false;
    api
      .get<{ items: AccessLogSummary[] }>(`/access-logs${query ? `?${query}` : ""}`)
      .then((res) => {
        if (!cancelled) setItems(res.items);
      });
    return () => {
      cancelled = true;
    };
  }, [rangeStart, rangeEnd]);

  const total = items?.reduce((sum, item) => sum + item.count, 0) ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-full w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-bold text-blue-700">접속 기록</p>
          <button onClick={onClose} className="text-lg text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value as PeriodPreset)}
            className="w-24 shrink-0 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
          >
            <option value="1w">최근 1주</option>
            <option value="2w">최근 2주</option>
            <option value="1m">최근 1달</option>
            <option value="all">전체기간</option>
            <option value="custom">직접입력</option>
          </select>

          {preset === "custom" && (
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
              />
              <span className="text-slate-400">~</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {items === null ? (
            <p className="py-6 text-center text-sm text-slate-400">불러오는 중...</p>
          ) : items.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">이 기간에는 접속 기록이 없어요.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                  <th className="py-2 font-medium">이름</th>
                  <th className="py-2 text-right font-medium">접속 횟수</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.name} className="border-b border-slate-50">
                    <td className="py-2 text-slate-700">{item.name}</td>
                    <td className="py-2 text-right font-semibold text-slate-800">{item.count}회</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="text-slate-500">
                  <td className="pt-2 text-xs">합계</td>
                  <td className="pt-2 text-right text-xs font-semibold">{total}회</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
