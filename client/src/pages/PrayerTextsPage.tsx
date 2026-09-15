import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { MemberPeriodFilters } from "../components/MemberPeriodFilters";
import { PrayerTextForm } from "../components/PrayerTextForm";
import { PrayerTextItem } from "../components/PrayerTextItem";
import type { Member, PrayerText } from "../types";

export function PrayerTextsPage() {
  const [items, setItems] = useState<PrayerText[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMemberId, setFilterMemberId] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  useEffect(() => {
    api
      .get<{ items: PrayerText[] }>("/prayer-texts")
      .then((res) => setItems(res.items))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get<{ members: Member[] }>("/members").then((res) => setMembers(res.members));
  }, []);

  async function handleCreate(content: string, meetingDate?: string) {
    const res = await api.post<{ item: PrayerText }>("/prayer-texts", { content, meetingDate });
    setItems((prev) =>
      [res.item, ...prev].sort(
        (a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime(),
      ),
    );
  }

  async function handleUpdate(id: string, data: { content?: string; meetingDate?: string }) {
    const res = await api.patch<{ item: PrayerText }>(`/prayer-texts/${id}`, data);
    setItems((prev) =>
      [...prev.filter((i) => i.id !== id), res.item].sort(
        (a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime(),
      ),
    );
  }

  async function handleDelete(id: string) {
    if (!confirm("이 릴레이 기도를 삭제할까요?")) return;
    await api.delete(`/prayer-texts/${id}`);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const filteredItems = useMemo(() => {
    const start = filterStartDate ? new Date(`${filterStartDate}T00:00:00`) : null;
    const end = filterEndDate ? new Date(`${filterEndDate}T23:59:59`) : null;
    return items.filter((item) => {
      if (filterMemberId && item.author.id !== filterMemberId) return false;
      const meetingDate = new Date(item.meetingDate);
      if (start && meetingDate < start) return false;
      if (end && meetingDate > end) return false;
      return true;
    });
  }, [items, filterMemberId, filterStartDate, filterEndDate]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
      <PrayerTextForm onSubmit={handleCreate} />
      <MemberPeriodFilters
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
      ) : filteredItems.length === 0 ? (
        <p className="rounded-xl bg-white/60 p-4 text-center text-sm text-slate-400">
          {items.length === 0 ? "아직 작성된 릴레이 기도가 없어요." : "조건에 맞는 릴레이 기도가 없어요."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filteredItems.map((item) => (
            <PrayerTextItem key={item.id} item={item} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </ul>
      )}
    </div>
  );
}
