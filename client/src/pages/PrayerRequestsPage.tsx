import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { BulkPrayerRequestForm } from "../components/BulkPrayerRequestForm";
import { MemberPeriodFilters } from "../components/MemberPeriodFilters";
import { PrayerRequestForm } from "../components/PrayerRequestForm";
import { PrayerRequestItem } from "../components/PrayerRequestItem";
import { useAuth } from "../context/AuthContext";
import type { Member, PrayerRequest } from "../types";
import { rangeForPreset, type PeriodPreset } from "../utils/date";

export function PrayerRequestsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<PrayerRequest[]>([]);
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
      .get<{ items: PrayerRequest[] }>(`/prayer-requests${query ? `?${query}` : ""}`)
      .then((res) => setItems(res.items))
      .finally(() => setLoading(false));
  }, [filterMemberId, rangeStart, rangeEnd]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    api.get<{ members: Member[] }>("/members").then((res) => setMembers(res.members));
  }, []);

  async function handleCreate(content: string, authorId?: string, requestDate?: string) {
    await api.post("/prayer-requests", { content, authorId, requestDate });
    await fetchItems();
  }

  async function handleBulkCreate(entries: { content: string; authorId: string }[]) {
    for (const entry of entries) {
      await api.post("/prayer-requests", entry);
    }
    await fetchItems();
  }

  async function handleUpdate(
    id: string,
    data: { content?: string; requestDate?: string; isAnswered?: boolean; answeredNote?: string | null },
  ) {
    await api.patch(`/prayer-requests/${id}`, data);
    await fetchItems();
  }

  async function handleDelete(id: string) {
    if (!confirm("이 기도제목을 삭제할까요?")) return;
    await api.delete(`/prayer-requests/${id}`);
    await fetchItems();
  }

  const active = items.filter((i) => !i.isAnswered);
  const answered = items.filter((i) => i.isAnswered);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6">
      <PrayerRequestForm members={members} onSubmit={handleCreate} />
      {user?.isAdmin && <BulkPrayerRequestForm members={members} onSubmit={handleBulkCreate} />}
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
      ) : (
        <>
          <section>
            <h2 className="mb-2 text-sm font-semibold text-slate-500">
              기도 중 ({active.length})
            </h2>
            {active.length === 0 ? (
              <p className="rounded-xl bg-white/60 p-4 text-center text-sm text-slate-400">
                조건에 맞는 기도제목이 없어요.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {active.map((item) => (
                  <PrayerRequestItem
                    key={item.id}
                    item={item}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))}
              </ul>
            )}
          </section>

          {answered.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-slate-500">
                응답된 기도 ({answered.length})
              </h2>
              <ul className="flex flex-col gap-2">
                {answered.map((item) => (
                  <PrayerRequestItem
                    key={item.id}
                    item={item}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
