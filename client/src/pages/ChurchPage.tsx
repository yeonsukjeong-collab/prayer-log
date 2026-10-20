import { useEffect, useState } from "react";
import { api } from "../api/client";
import { BenedictionCard } from "../components/BenedictionCard";
import { BulletinCard } from "../components/BulletinCard";
import { LoadingSpinner } from "../components/LoadingSpinner";
import type { MeditationPayload } from "../components/MeditationFields";
import { MeditationForm } from "../components/MeditationForm";
import { MeditationItem } from "../components/MeditationItem";
import type { Benediction, Meditation } from "../types";

export function ChurchPage() {
  const [benediction, setBenediction] = useState<Benediction | null>(null);
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ item: Benediction | null }>("/benediction").then((res) => setBenediction(res.item)),
      api.get<{ items: Meditation[] }>("/meditations").then((res) => setMeditations(res.items)),
    ]).finally(() => setLoading(false));
  }, []);

  async function handleCreateMeditation(payload: MeditationPayload) {
    const res = await api.post<{ item: Meditation }>("/meditations", payload);
    setMeditations((prev) => [res.item, ...prev]);
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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
      <BenedictionCard benediction={benediction} />

      <BulletinCard />

      <section className="rounded-xl bg-white p-3 shadow-sm">
        <MeditationForm onSubmit={handleCreateMeditation} />
      </section>

      <section>
        {meditations.length === 0 ? (
          <p className="rounded-xl bg-white/60 p-4 text-center text-sm text-slate-400">
            아직 기록된 말씀이 없어요.
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
    </div>
  );
}
