import { useEffect, useState } from "react";
import { api } from "../api/client";
import { PrayerTextForm } from "../components/PrayerTextForm";
import { PrayerTextItem } from "../components/PrayerTextItem";
import type { PrayerText } from "../types";

export function PrayerTextsPage() {
  const [items, setItems] = useState<PrayerText[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ items: PrayerText[] }>("/prayer-texts")
      .then((res) => setItems(res.items))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(title: string, content: string) {
    const res = await api.post<{ item: PrayerText }>("/prayer-texts", { title, content });
    setItems((prev) => [res.item, ...prev]);
  }

  async function handleDelete(id: string) {
    if (!confirm("이 기도문을 삭제할까요?")) return;
    await api.delete(`/prayer-texts/${id}`);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
      <PrayerTextForm onSubmit={handleCreate} />

      {loading ? (
        <p className="text-center text-sm text-slate-400">불러오는 중...</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl bg-white/60 p-4 text-center text-sm text-slate-400">
          아직 작성된 기도문이 없어요.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <PrayerTextItem key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </ul>
      )}
    </div>
  );
}
