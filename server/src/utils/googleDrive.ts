import { env } from "../env.js";

/**
 * 사진을 정연석 목자의 구글 드라이브에 저장합니다.
 * 서버가 구글 계정에 직접 접근하지 않고, 그 계정으로 배포한 앱스 스크립트
 * (google-apps-script/photoDrive.gs)에 요청을 보내 저장합니다.
 */

export const driveConfigured = Boolean(env.driveScriptUrl && env.driveScriptSecret);

async function callScript(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  // 앱스 스크립트 웹 앱은 결과를 다른 주소로 리디렉션해서 돌려주므로 fetch가 따라가게 둡니다.
  const res = await fetch(env.driveScriptUrl!, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ ...body, secret: env.driveScriptSecret }),
    signal: AbortSignal.timeout(60_000),
  });
  const text = await res.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Drive script returned non-JSON (HTTP ${res.status}): ${text.slice(0, 200)}`);
  }
  if (data.error) throw new Error(`Drive script error: ${data.error}`);
  return data;
}

/** data URL 이미지를 드라이브에 올리고 파일 ID를 돌려줍니다. */
export async function uploadToDrive(dataUrl: string, name: string): Promise<string> {
  const data = await callScript({ action: "upload", dataUrl, name });
  if (typeof data.id !== "string") throw new Error("Drive script returned no file id");
  return data.id;
}

/** 드라이브의 사진을 휴지통으로 옮깁니다. 실패해도 앱 동작에는 영향이 없도록 기록만 남깁니다. */
export async function trashOnDrive(fileId: string) {
  try {
    await callScript({ action: "trash", id: fileId });
  } catch (err) {
    console.error(err);
  }
}

export function driveImageUrl(fileId: string, width: number) {
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w${width}`;
}
