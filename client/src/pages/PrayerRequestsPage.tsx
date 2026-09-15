import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { BulkPrayerRequestForm } from "../components/BulkPrayerRequestForm";
import { PrayerRequestFilters } from "../components/PrayerRequestFilters";
import { PrayerRequestForm } from "../components/PrayerRequestForm";
import { PrayerRequestItem } from "../components/PrayerRequestItem";
import type { Member, PrayerRequest } from "../types";

export function PrayerRequestsPage() {
  const [items, setItems] = useState<PrayerRequest[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMemberId, setFilterMemberId] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  useEffect(() => {
    api
      .get<{ items: PrayerRequest[] }>("/prayer-requests")
      .then((res) => setItems(res.items))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get<{ members: Member[] }>("/members").then((res) => setMembers(res.members));
  }, []);

  async function handleCreate(content: string, authorId?: string) {
    const res = await api.post<{ item: PrayerRequest }>("/prayer-requests", { content, authorId });
    setItems((prev) => [res.item, ...prev]);
  }

  async function handleBulkCreate(entries: { content: string; authorId: string }[]) {
    const created: PrayerRequest[] = [];
    for (const entry of entries) {
      const res = await api.post<{ item: PrayerRequest }>("/prayer-requests", entry);
      created.push(res.item);
    }
    setItems((prev) => [...created, ...prev]);
  }

  async function handleUpdate(
    id: string,
    data: { content?: string; isAnswered?: boolean; answeredNote?: string | null },
  ) {
    const res = await api.patch<{ item: PrayerRequest }>(`/prayer-requests/${id}`, data);
    setItems((prev) =>
      [...prev.filter((i) => i.id !== id), res.item].sort((a, b) => {
        if (a.isAnswered !== b.isAnswered) return a.isAnswered ? 1 : -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    );
  }

  async function handleDelete(id: string) {
    if (!confirm("이 기도제목을 삭제할까요?")) return;
    await api.delete(`/prayer-requests/${id}`);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const filteredItems = useMemo(() => {
    const start = filterStartDate ? new Date(`${filterStartDate}T00:00:00`) : null;
    const end = filterEndDate ? new Date(`${filterEndDate}T23:59:59`) : null;
    return items.filter((item) => {
      if (filterMemberId && item.author.id !== filterMemberId) return false;
      const createdAt = new Date(item.createdAt);
      if (start && createdAt < start) return false;
      if (end && createdAt > end) return false;
      return true;
    });
  }, [items, filterMemberId, filterStartDate, filterEndDate]);

  const active = filteredItems.filter((i) => !i.isAnswered);
  const answered = filteredItems.filter((i) => i.isAnswered);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6">
      <PrayerRequestForm members={members} onSubmit={handleCreate} />
      <BulkPrayerRequestForm members={members} onSubmit={handleBulkCreate} />
      <PrayerRequestFilters
        members={members}
        memberId={filterMemberId}
        onMemberChange={setFilterMemberId}
        startDate={filterStartDate}
        onStartDateChange={setFilterStartDate}
        endDate={filterEndDate}
        onEndDateChange={setFilterEndDate}
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
                {items.length === 0 ? "아직 등록된 기도제목이 없어요." : "조건에 맞는 기도제목이 없어요."}
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
