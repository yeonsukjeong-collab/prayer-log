import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { MemberPeriodFilters } from "../components/MemberPeriodFilters";
import { PhotoUploadForm } from "../components/PhotoUploadForm";
import { PhotoViewerModal } from "../components/PhotoViewerModal";
import type { Member, PhotoSummary } from "../types";
import { formatDateWithWeekday, rangeForPreset, type PeriodPreset } from "../utils/date";

interface PhotoGroup {
  dateKey: string;
  dateLabel: string;
  weekdayLabel: string;
  photos: PhotoSummary[];
}

export function MemoriesPage() {
  const [items, setItems] = useState<PhotoSummary[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMemberId, setFilterMemberId] = useState("");
  const [preset, setPreset] = useState<PeriodPreset>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [viewingPhoto, setViewingPhoto] = useState<PhotoSummary | null>(null);

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
      .get<{ items: PhotoSummary[] }>(`/photos${query ? `?${query}` : ""}`)
      .then((res) => setItems(res.items))
      .finally(() => setLoading(false));
  }, [filterMemberId, rangeStart, rangeEnd]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    api.get<{ members: Member[] }>("/members").then((res) => setMembers(res.members));
  }, []);

  async function handleUpload(entry: {
    thumbnailData: string;
    imageData: string;
    caption?: string;
    authorId?: string;
    photoDate?: string;
  }) {
    await api.post("/photos", entry);
    await fetchItems();
  }

  async function handleDelete(id: string) {
    if (!confirm("이 사진을 삭제할까요?")) return;
    await api.delete(`/photos/${id}`);
    setViewingPhoto(null);
    await fetchItems();
  }

  const groups: PhotoGroup[] = useMemo(() => {
    const map = new Map<string, PhotoGroup>();
    for (const photo of items) {
      const date = new Date(photo.photoDate);
      const dateKey = date.toDateString();
      if (!map.has(dateKey)) {
        const { dateLabel, weekdayLabel } = formatDateWithWeekday(date);
        map.set(dateKey, { dateKey, dateLabel, weekdayLabel, photos: [] });
      }
      map.get(dateKey)!.photos.push(photo);
    }
    return Array.from(map.values());
  }, [items]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
      <PhotoUploadForm members={members} onUpload={handleUpload} />
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

      {loading && items.length === 0 ? (
        <LoadingSpinner />
      ) : (
        <>
          {loading && (
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
              새로고침 중...
            </div>
          )}
          {groups.length === 0 ? (
            <p className="rounded-xl bg-white/60 p-4 text-center text-sm text-slate-400">
              조건에 맞는 사진이 없어요.
            </p>
          ) : (
            groups.map((group) => (
              <section key={group.dateKey}>
                <h2 className="mb-2 text-sm font-bold text-blue-700">
                  {group.dateLabel} ({group.weekdayLabel})
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {group.photos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => setViewingPhoto(photo)}
                      className="aspect-square overflow-hidden rounded-lg bg-slate-100 shadow-sm"
                    >
                      <img
                        src={photo.thumbnailData}
                        alt={photo.caption ?? "사진"}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </section>
            ))
          )}
        </>
      )}

      {viewingPhoto && (
        <PhotoViewerModal
          photo={viewingPhoto}
          onClose={() => setViewingPhoto(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
