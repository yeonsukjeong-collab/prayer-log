import { parse } from "exifr";

/** Reads the photo's original capture date from EXIF metadata, if present. */
export async function getCaptureDate(file: File): Promise<Date | null> {
  try {
    const exif = await parse(file, { pick: ["DateTimeOriginal", "CreateDate"] });
    const date = exif?.DateTimeOriginal ?? exif?.CreateDate;
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  } catch {
    return null;
  }
}
