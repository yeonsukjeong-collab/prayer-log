import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { MemberPeriodFilters } from "../components/MemberPeriodFilters";
import { PrayerTextForm } from "../components/PrayerTextForm";
import { PrayerTextItem } from "../components/PrayerTextItem";
import type { Member, PrayerText } from "../types";
import { rangeForPreset, type PeriodPreset } from "../utils/date";

export function PrayerTextsPage() {
  const [items, setItems] = useState<PrayerText[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMemberId, setFilterMemberId] = useState("");
  const [preset, setPreset] = useState<PeriodPreset>("1w");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const { start: rangeStart, end: rangeEnd } = useMemo(() => {
    if (preset === "custom") return { start: customStartDate, end: customEndDate };
    return rangeForPreset(preset);
  }, [preset, customStartDate, customEndDate]);

  const fetchItems = useCallback(() => {
    const params = new URLSearchParams();
    if (filterMemberId) params.set("authorId", filterMemberId);
    if (rangeStart) params.set("startDate", rangeStart);
    if (rangeEnd) params.set("endDate", rangeEnd);
    const query = params.toString();

    setLoading(true);
    return api
      .get<{ items: PrayerText[] }>(`/prayer-texts${query ? `?${query}` : ""}`)
      .then((res) => setItems(res.items))
      .finally(() => setLoading(false));
  }, [filterMemberId, rangeStart, rangeEnd]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    api.get<{ members: Member[] }>("/members").then((res) => setMembers(res.members));
  }, []);

  async function handleCreate(content: string, authorId?: string, meetingDate?: string) {
    await api.post("/prayer-texts", { content, authorId, meetingDate });
    await fetchItems();
  }

  async function handleUpdate(id: string, data: { content?: string; meetingDate?: string }) {
    await api.patch(`/prayer-texts/${id}`, data);
    await fetchItems();
  }

  async function handleDelete(id: string) {
    if (!confirm("이 릴레이 기도를 삭제할까요?")) return;
    await api.delete(`/prayer-texts/${id}`);
    await fetchItems();
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
      <PrayerTextForm members={members} onSubmit={handleCreate} />
      <MemberPeriodFilters
        members={members}
        memberId={filterMemberId}
        onMemberChange={setFilterMemberId}
        preset={preset}
        onPresetChange={setPreset}
        customStartDate={customStartDate}
        onCustomStartDateChange={setCustomStartDate}
        customEndDate={customEndDate}
        onCustomEndDateChange={setCustomEndDate}
      />

      {loading ? (
        <p className="text-center text-sm text-slate-400">불러오는 중...</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl bg-white/60 p-4 text-center text-sm text-slate-400">
          조건에 맞는 릴레이 기도가 없어요.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <PrayerTextItem key={item.id} item={item} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </ul>
      )}
    </div>
  );
}
