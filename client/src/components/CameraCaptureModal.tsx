import { useEffect, useRef, useState } from "react";

interface Props {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export function CameraCaptureModal({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("이 브라우저에서는 카메라를 사용할 수 없습니다.");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setError("카메라에 접근할 수 없습니다. 브라우저의 카메라 권한을 확인해주세요.");
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function handleCapture() {
    const video = videoRef.current;
    if (!video || !ready) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9,
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4">
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-bold text-slate-700">카메라로 촬영</p>
          <button onClick={onClose} className="text-lg text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
        <div className="flex min-h-[240px] items-center justify-center bg-black">
          {error ? (
            <p className="p-6 text-center text-sm text-red-400">{error}</p>
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="w-full" />
          )}
        </div>
        <div className="flex justify-center gap-2 p-4">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-500">
            취소
          </button>
          <button
            onClick={handleCapture}
            disabled={!ready}
            className="rounded-lg bg-orange-500 px-6 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            📷 촬영
          </button>
        </div>
      </div>
    </div>
  );
}
