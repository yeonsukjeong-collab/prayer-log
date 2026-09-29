import type { Benediction } from "../types";

interface Props {
  benediction: Benediction | null;
}

export function BenedictionCard({ benediction }: Props) {
  return (
    <section className="rounded-xl bg-white p-3 shadow-sm">
      <h2 className="text-sm font-bold text-blue-700">축도</h2>

      {benediction ? (
        <p className="mt-2 whitespace-pre-wrap text-sm font-bold text-slate-800">{benediction.content}</p>
      ) : (
        <p className="mt-2 text-sm text-slate-400">아직 등록된 축도가 없어요.</p>
      )}
    </section>
  );
}
