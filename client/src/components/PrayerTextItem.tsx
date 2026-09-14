import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { PrayerText } from "../types";

interface Props {
  item: PrayerText;
  onDelete: (id: string) => void;
}

export function PrayerTextItem({ item, onDelete }: Props) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const isOwner = user?.id === item.author.id;

  const meetingDate = new Date(item.meetingDate).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <button
        className="flex w-full items-start justify-between gap-3 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div>
          <p className="font-semibold text-slate-800">{item.title}</p>
          <p className="mt-1 text-xs text-slate-400">
            {item.author.name} · {meetingDate}
          </p>
        </div>
        <span className="text-slate-400">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="whitespace-pre-wrap text-sm text-slate-700">{item.content}</p>
          {isOwner && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => onDelete(item.id)}
                className="text-xs text-slate-400 hover:text-red-500"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
