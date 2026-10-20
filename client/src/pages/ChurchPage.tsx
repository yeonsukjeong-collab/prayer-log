import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { BenedictionCard } from "../components/BenedictionCard";
import { BulletinCard } from "../components/BulletinCard";
import { LoadingSpinner } from "../components/LoadingSpinner";
import type { MeditationPayload } from "../components/MeditationFields";
import { MeditationForm } from "../components/MeditationForm";
import { MeditationItem } from "../components/MeditationItem";
import { MemberPeriodFilters } from "../components/MemberPeriodFilters";
import { PraiseCard } from "../components/PraiseCard";
import type { Benediction, Meditation, Member } from "../types";
import { localDayBounds, PERIOD_LABELS, rangeForPreset, type PeriodPreset } from "../utils/date";
import { exportMeditationsToExcel } from "../utils/exportExcel";

export function ChurchPage() {
  const [benediction, setBenediction] = useState<Benediction | null>(null);
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [meditationsLoading, setMeditationsLoading] = useState(true);
  const [filterMemberId, setFilterMemberId] = useState("");
  const [preset, setPreset] = useState<PeriodPreset>("1w");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const { start: rangeStart, end: rangeEnd } = useMemo(() => {
    if (preset === "custom") return { start: customStartDate, end: customEndDate };
    return rangeForPreset(preset);
  }, [preset, customStartDate, customEndDate]);

  const fetchMeditations = useCallback(() => {
    const params = new URLSearchParams();
    if (filterMemberId) params.set("authorId", filterMemberId);
    const { startAt, endBefore } = localDayBounds(rangeStart, rangeEnd);
    if (startAt) params.set("startAt", startAt);
    if (endBefore) params.set("endBefore", endBefore);
    const query = params.toString();

    setMeditationsLoading(true);
    return api
      .get<{ items: Meditation[] }>(`/meditations${query ? `?${query}` : ""}`)
      .then((res) => setMeditations(res.items))
      .finally(() => setMeditationsLoading(false));
  }, [filterMemberId, rangeStart, rangeEnd]);

  useEffect(() => {
    fetchMeditations();
  }, [fetchMeditations]);

  useEffect(() => {
    Promise.all([
      api.get<{ item: Benediction | null }>("/benediction").then((res) => setBenediction(res.item)),
      api.get<{ members: Member[] }>("/members").then((res) => setMembers(res.members)),
    ]).finally(() => setLoading(false));
  }, []);

  async function handleCreateMeditation(payload: MeditationPayload) {
    await api.post("/meditations", payload);
    await fetchMeditations();
  }

  async function handleUpdateMeditation(id: string, payload: MeditationPayload) {
    const res = await api.put<{ item: Meditation }>(`/meditations/${id}`, payload);
    setMeditations((prev) => prev.map((i) => (i.id === id ? res.item : i)));
  }

  async function handleDeleteMeditation(id: string) {
    if (!confirm("이 묵상을 삭제할까요?")) return;
    await api.delete(`/meditations/${id}`);
    setMeditations((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleExport() {
    if (meditations.length === 0) {
      alert("내려받을 말씀 묵상이 없어요.");
      return;
    }
    const memberName = filterMemberId
      ? (members.find((m) => m.id === filterMemberId)?.name ?? "목원")
      : "전체목원";
    await exportMeditationsToExcel(meditations, `${memberName}_${PERIOD_LABELS[preset]}`);
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
      <BenedictionCard benediction={benediction} />

      <BulletinCard />

      <PraiseCard />

      <section className="rounded-xl bg-white p-3 shadow-sm">
        <MeditationForm onSubmit={handleCreateMeditation} />
      </section>

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
        onExport={handleExport}
      />

      {meditationsLoading && meditations.length === 0 ? (
        <LoadingSpinner />
      ) : (
        <section>
          {meditations.length === 0 ? (
            <p className="rounded-xl bg-white/60 p-4 text-center text-sm text-slate-400">
              조건에 맞는 말씀 묵상이 없어요.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {meditations.map((item) => (
                <MeditationItem
                  key={item.id}
                  item={item}
                  onUpdate={handleUpdateMeditation}
                  onDelete={handleDeleteMeditation}
                />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
