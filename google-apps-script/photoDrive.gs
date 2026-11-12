/**
 * 자카르타 목장 앱의 사진을 구글 드라이브에 저장하는 앱스 스크립트입니다.
 * 사진을 저장할 구글 계정(yeonsuk.jeong@gmail.com)으로 script.google.com 에 붙여 넣고,
 * README의 "사진을 구글 드라이브에 저장하기" 순서대로 배포합니다.
 *
 * 앱 서버만 부를 수 있도록, 요청마다 setup()이 만든 비밀 키(SECRET)를 확인합니다.
 */

const FOLDER_NAME = "자카르타 목장 사진";

/** 처음 한 번 직접 실행합니다. 드라이브 권한을 허락받고, 사진 폴더와 비밀 키를 만듭니다. */
function setup() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty("SECRET")) props.setProperty("SECRET", Utilities.getUuid() + Utilities.getUuid());
  const folder = getFolder();
  Logger.log("사진 폴더: " + folder.getUrl());
  Logger.log("GOOGLE_DRIVE_SCRIPT_SECRET = " + props.getProperty("SECRET"));
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json({ error: "bad request" });
  }
  const secret = PropertiesService.getScriptProperties().getProperty("SECRET");
  if (!secret || body.secret !== secret) return json({ error: "unauthorized" });

  try {
    if (body.action === "upload") {
      const match = /^data:(image\/[\w.+-]+);base64,(.+)$/.exec(body.dataUrl || "");
      if (!match) return json({ error: "bad image" });
      const blob = Utilities.newBlob(Utilities.base64Decode(match[2]), match[1], body.name || "photo.jpg");
      const file = getFolder().createFile(blob);
      // 앱 화면에서 바로 보여줄 수 있도록 "링크가 있는 사람은 보기 가능"으로 둡니다.
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return json({ id: file.getId() });
    }
    if (body.action === "trash") {
      DriveApp.getFileById(body.id).setTrashed(true);
      return json({ ok: true });
    }
    return json({ error: "unknown action" });
  } catch (err) {
    return json({ error: String(err) });
  }
}

function getFolder() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty("FOLDER_ID");
  if (id) {
    try {
      return DriveApp.getFolderById(id);
    } catch (err) {
      // 폴더가 지워졌으면 새로 만듭니다.
    }
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const again = props.getProperty("FOLDER_ID");
    if (again && again !== id) return DriveApp.getFolderById(again);
    const folder = DriveApp.createFolder(FOLDER_NAME);
    props.setProperty("FOLDER_ID", folder.getId());
    return folder;
  } finally {
    lock.releaseLock();
  }
}

function json(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
