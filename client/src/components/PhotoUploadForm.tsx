import { useRef, useState, type ChangeEvent } from "react";
import { useAuth } from "../context/AuthContext";
import type { Member } from "../types";
import { processPhotoFile } from "../utils/image";
import { toDateInputValue } from "../utils/date";
import { getCaptureDate } from "../utils/exif";
import { CameraCaptureModal } from "./CameraCaptureModal";

interface Props {
  members: Member[];
  onUpload: (entry: {
    thumbnailData: string;
    imageData: string;
    authorId?: string;
    photoDate?: string;
  }) => Promise<void>;
}

const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export function PhotoUploadForm({ members, onUpload }: Props) {
  const { user } = useAuth();
  const [authorId, setAuthorId] = useState(user?.id ?? "");
  const [photoDate, setPhotoDate] = useState(() => toDateInputValue(new Date()));
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [showCamera, setShowCamera] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return;

    setUploading(true);
    setProgress({ done: 0, total: files.length });
    try {
      for (const file of files) {
        const [{ thumbnailData, imageData }, captureDate] = await Promise.all([
          processPhotoFile(file),
          getCaptureDate(file),
        ]);
        await onUpload({
          thumbnailData,
          imageData,
          authorId: authorId || undefined,
          photoDate: captureDate ? toDateInputValue(captureDate) : photoDate || undefined,
        });
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    await uploadFiles(files);
  }

  function handleCameraButtonClick() {
    if (IS_MOBILE) {
      cameraInputRef.current?.click();
    } else {
      setShowCamera(true);
    }
  }

  async function handleCameraCapture(file: File) {
    setShowCamera(false);
    await uploadFiles([file]);
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-white p-3 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {members.length > 0 && (
          <select
            value={authorId}
            onChange={(e) => setAuthorId(e.target.value)}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        )}
        <input
          type="date"
          value={photoDate}
          onChange={(e) => setPhotoDate(e.target.value)}
          title="사진에 촬영 날짜 정보가 없을 때 사용할 기본 날짜"
          className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
        />
      </div>

      <div className="flex gap-2">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileInputChange}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={handleCameraButtonClick}
          className="flex-1 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          📷 사진 촬영
        </button>
        <button
          type="button"
          disabled={uploading}
          onClick={() => galleryInputRef.current?.click()}
          className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          🖼️ 사진 업로드
        </button>
      </div>

      {uploading && (
        <p className="text-center text-xs text-slate-400">
          업로드 중... ({progress.done}/{progress.total})
        </p>
      )}

      {showCamera && (
        <CameraCaptureModal onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />
      )}
    </div>
  );
}
