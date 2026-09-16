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

async function resizeToDataUrl(img: HTMLImageElement, maxDimension: number, quality: number): Promise<string> {
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

export interface ProcessedPhoto {
  thumbnailData: string;
  imageData: string;
}

/** Resizes a photo file client-side into a small thumbnail and a display-sized full image. */
export async function processPhotoFile(file: File): Promise<ProcessedPhoto> {
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);

  const [thumbnailData, imageData] = await Promise.all([
    resizeToDataUrl(img, 320, 0.7),
    resizeToDataUrl(img, 1600, 0.75),
  ]);

  return { thumbnailData, imageData };
}
