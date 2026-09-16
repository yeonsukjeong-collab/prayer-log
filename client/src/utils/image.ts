function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("이미지를 불러올 수 없습니다."));
    img.src = src;
  });
}

function dataUrlByteSize(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function resizeToDataUrl(img: HTMLImageElement, maxDimension: number, quality: number): string {
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("캔버스를 사용할 수 없습니다.");
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", quality);
}

const QUALITY_STEPS = [0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2];

/** Resizes/compresses an image, lowering quality then dimension until it fits under maxBytes. */
function resizeUnderSize(img: HTMLImageElement, initialMaxDimension: number, maxBytes: number): string {
  let dimension = initialMaxDimension;
  let best = resizeToDataUrl(img, dimension, QUALITY_STEPS[0]);

  for (let attempt = 0; attempt < 5; attempt++) {
    for (const quality of QUALITY_STEPS) {
      const candidate = resizeToDataUrl(img, dimension, quality);
      best = candidate;
      if (dataUrlByteSize(candidate) <= maxBytes) {
        return candidate;
      }
    }
    dimension = Math.round(dimension * 0.75);
  }

  return best;
}

export interface ProcessedPhoto {
  thumbnailData: string;
  imageData: string;
}

const MAX_IMAGE_BYTES = 1_000_000; // ~1MB
const MAX_THUMBNAIL_BYTES = 80_000;

/** Resizes a photo file client-side into a small thumbnail and a display-sized full image, each capped in size. */
export async function processPhotoFile(file: File): Promise<ProcessedPhoto> {
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);

  const thumbnailData = resizeUnderSize(img, 320, MAX_THUMBNAIL_BYTES);
  const imageData = resizeUnderSize(img, 1600, MAX_IMAGE_BYTES);

  return { thumbnailData, imageData };
}
