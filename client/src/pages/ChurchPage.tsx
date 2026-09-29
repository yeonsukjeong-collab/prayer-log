import { useEffect, useState } from "react";
import { api } from "../api/client";
import { BenedictionCard } from "../components/BenedictionCard";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { PastorPrayerForm } from "../components/PastorPrayerForm";
import { PastorPrayerItem } from "../components/PastorPrayerItem";
import type { Benediction, PastorPrayer } from "../types";

export function ChurchPage() {
  const [benediction, setBenediction] = useState<Benediction | null>(null);
  const [prayers, setPrayers] = useState<PastorPrayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ item: Benediction | null }>("/benediction").then((res) => setBenediction(res.item)),
      api.get<{ items: PastorPrayer[] }>("/pastor-prayers").then((res) => setPrayers(res.items)),
    ]).finally(() => setLoading(false));
  }, []);

  async function handleSaveBenediction(content: string) {
    const res = await api.put<{ item: Benediction }>("/benediction", { content });
    setBenediction(res.item);
  }

  async function handleCreatePrayer(content: string, prayerDate?: string) {
    const res = await api.post<{ item: PastorPrayer }>("/pastor-prayers", { content, prayerDate });
    setPrayers((prev) =>
      [res.item, ...prev].sort(
        (a, b) => new Date(b.prayerDate).getTime() - new Date(a.prayerDate).getTime(),
      ),
    );
  }

  async function handleUpdatePrayer(id: string, data: { content?: string; prayerDate?: string }) {
    const res = await api.patch<{ item: PastorPrayer }>(`/pastor-prayers/${id}`, data);
    setPrayers((prev) =>
      [...prev.filter((i) => i.id !== id), res.item].sort(
        (a, b) => new Date(b.prayerDate).getTime() - new Date(a.prayerDate).getTime(),
      ),
    );
  }

  async function handleDeletePrayer(id: string) {
    if (!confirm("이 기도문을 삭제할까요?")) return;
    await api.delete(`/pastor-prayers/${id}`);
    setPrayers((prev) => prev.filter((i) => i.id !== id));
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
      <BenedictionCard benediction={benediction} onSave={handleSaveBenediction} />

      <PastorPrayerForm onSubmit={handleCreatePrayer} />

      {prayers.length === 0 ? (
        <p className="rounded-xl bg-white/60 p-4 text-center text-sm text-slate-400">
          아직 등록된 기도문이 없어요.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {prayers.map((item) => (
            <PastorPrayerItem
              key={item.id}
              item={item}
              onUpdate={handleUpdatePrayer}
              onDelete={handleDeletePrayer}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
