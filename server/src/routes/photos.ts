import crypto from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../auth/middleware.js";
import { endOfDayExclusive } from "../utils/date.js";
import { driveConfigured, driveImageUrl, trashOnDrive, uploadToDrive } from "../utils/googleDrive.js";

const router = Router();
router.use(requireAuth);

const photoSummarySelect = {
  id: true,
  caption: true,
  photoDate: true,
  thumbnailData: true,
  driveFileId: true,
  createdAt: true,
  author: { select: { id: true, name: true } },
  _count: { select: { comments: true } },
} as const;

const THUMBNAIL_WIDTH = 400;
const FULL_WIDTH = 1600;

/** 우리 서버를 거쳐 드라이브 사진을 받는 주소입니다. 브라우저가 드라이브에 직접 가지 않아 PC·휴대폰 모두 같은 방식으로 보입니다. */
function imageRoute(photoId: string, width: number, download = false) {
  return `/api/photos/${photoId}/image?w=${width}${download ? "&download=1" : ""}`;
}

/** 드라이브로 옮긴 사진은 이미지 데이터 대신 이미지 주소를 보내 줍니다. 화면은 둘 다 <img src>로 씁니다. */
function withDriveUrls<
  T extends { id: string; driveFileId: string | null; thumbnailData: string; imageData?: string },
>(photo: T) {
  const { driveFileId, ...rest } = photo;
  if (!driveFileId) return { ...rest, downloadUrl: rest.imageData };
  return {
    ...rest,
    thumbnailData: imageRoute(photo.id, THUMBNAIL_WIDTH),
    ...(rest.imageData !== undefined ? { imageData: imageRoute(photo.id, FULL_WIDTH) } : {}),
    downloadUrl: imageRoute(photo.id, FULL_WIDTH, true),
  };
}

function withCommentCount<
  T extends { _count: { comments: number }; id: string; driveFileId: string | null; thumbnailData: string },
>(
  photo: T,
) {
  const { _count, ...rest } = photo;
  const { downloadUrl: _, ...summary } = withDriveUrls(rest);
  return { ...summary, commentCount: _count.comments };
}

const listQuerySchema = z.object({
  authorId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

router.get("/", async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }
  const { authorId, startDate, endDate } = parsed.data;

  const items = await prisma.photo.findMany({
    where: {
      ...(authorId ? { authorId } : {}),
      ...(startDate || endDate
        ? {
            photoDate: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lt: endOfDayExclusive(endDate) } : {}),
            },
          }
        : {}),
    },
    orderBy: { photoDate: "desc" },
    select: photoSummarySelect,
  });
  res.json({ items: items.map(withCommentCount) });
});

router.get("/:id", async (req, res) => {
  const photo = await prisma.photo.findUnique({
    where: { id: req.params.id },
    include: {
      author: { select: { id: true, name: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });
  if (!photo) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ item: withDriveUrls(photo) });
});

const imageQuerySchema = z.object({
  w: z.coerce.number().int().min(100).max(FULL_WIDTH).default(FULL_WIDTH),
  download: z.literal("1").optional(),
});

router.get("/:id/image", async (req, res) => {
  const query = imageQuerySchema.safeParse(req.query);
  const photo = await prisma.photo.findUnique({ where: { id: req.params.id }, select: { driveFileId: true } });
  if (!query.success || !photo?.driveFileId) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  try {
    const upstream = await fetch(driveImageUrl(photo.driveFileId, query.data.w), {
      signal: AbortSignal.timeout(30_000),
    });
    const type = upstream.headers.get("content-type") ?? "";
    if (!upstream.ok || !type.startsWith("image/")) throw new Error(`Drive image HTTP ${upstream.status} (${type})`);
    res.setHeader("Content-Type", type);
    // 같은 사진은 바뀌지 않으므로 브라우저에 오래 저장해 두게 합니다.
    res.setHeader("Cache-Control", "private, max-age=31536000, immutable");
    if (query.data.download) res.setHeader("Content-Disposition", `attachment; filename="photo-${req.params.id}.jpg"`);
    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "사진을 불러오지 못했어요." });
  }
});

const commentSchema = z.object({
  content: z.string().trim().min(1).max(1000),
});

router.post("/:id/comments", async (req, res) => {
  const photo = await prisma.photo.findUnique({ where: { id: req.params.id } });
  if (!photo) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const parsed = commentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "댓글 내용을 입력해주세요." });
    return;
  }

  const comment = await prisma.photoComment.create({
    data: {
      content: parsed.data.content,
      photoId: req.params.id,
      authorId: req.userId!,
    },
    include: { author: { select: { id: true, name: true } } },
  });
  res.status(201).json({ comment });
});

router.delete("/:id/comments/:commentId", async (req, res) => {
  const comment = await prisma.photoComment.findUnique({ where: { id: req.params.commentId } });
  if (!comment || comment.photoId !== req.params.id) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (comment.authorId !== req.userId) {
    const currentUser = await prisma.member.findUnique({ where: { id: req.userId } });
    if (!currentUser?.isLeader) {
      res.status(403).json({ error: "본인이 작성한 댓글만 삭제할 수 있습니다." });
      return;
    }
  }

  await prisma.photoComment.delete({ where: { id: req.params.commentId } });
  res.status(204).send();
});

const dataUrlSchema = z.string().trim().startsWith("data:image/").max(8_000_000);

const createSchema = z.object({
  caption: z.string().trim().max(500).optional(),
  photoDate: z.coerce.date().optional(),
  authorId: z.string().uuid().optional(),
  thumbnailData: dataUrlSchema,
  imageData: dataUrlSchema,
});

router.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "사진 데이터가 올바르지 않습니다." });
    return;
  }

  let authorId = req.userId!;
  if (parsed.data.authorId && parsed.data.authorId !== req.userId) {
    const target = await prisma.member.findUnique({ where: { id: parsed.data.authorId } });
    if (!target) {
      res.status(400).json({ error: "대상을 찾을 수 없습니다." });
      return;
    }
    authorId = target.id;
  }

  // 드라이브가 설정되어 있으면 사진은 드라이브에 두고 DB에는 파일 ID만 남깁니다.
  let driveFileId: string | null = null;
  if (driveConfigured) {
    try {
      driveFileId = await uploadToDrive(parsed.data.imageData, `${crypto.randomUUID()}.jpg`);
    } catch (err) {
      console.error(err);
      res.status(502).json({ error: "사진을 구글 드라이브에 올리지 못했어요. 잠시 후 다시 시도해주세요." });
      return;
    }
  }

  const item = await prisma.photo.create({
    data: {
      caption: parsed.data.caption,
      photoDate: parsed.data.photoDate ?? new Date(),
      thumbnailData: driveFileId ? "" : parsed.data.thumbnailData,
      imageData: driveFileId ? "" : parsed.data.imageData,
      driveFileId,
      authorId,
    },
    select: photoSummarySelect,
  });
  res.status(201).json({ item: withCommentCount(item) });
});

router.delete("/:id", async (req, res) => {
  const existing = await prisma.photo.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (existing.authorId !== req.userId) {
    const currentUser = await prisma.member.findUnique({ where: { id: req.userId } });
    if (!currentUser?.isLeader) {
      res.status(403).json({ error: "본인이 올린 사진만 삭제할 수 있습니다." });
      return;
    }
  }

  await prisma.photo.delete({ where: { id: req.params.id } });
  if (existing.driveFileId) await trashOnDrive(existing.driveFileId);
  res.status(204).send();
});

let migrating = false;

/**
 * DB에 들어 있는 예전 사진을 하나씩 드라이브로 옮깁니다. 서버가 중간에 잠들어도 다음에 켜질 때 이어서 합니다.
 * 드라이브에 올린 사진은 DB의 이미지 데이터를 비우고, 비운 것이 있으면 VACUUM FULL로 디스크 공간을 돌려받습니다.
 */
export async function moveOldPhotosToDrive() {
  if (!driveConfigured || migrating) return;
  migrating = true;
  let moved = 0;
  try {
    for (;;) {
      const photo = await prisma.photo.findFirst({
        where: { driveFileId: null, imageData: { not: "" } },
        orderBy: { createdAt: "asc" },
        select: { id: true, imageData: true },
      });
      if (!photo) break;
      const fileId = await uploadToDrive(photo.imageData, `${photo.id}.jpg`);
      await prisma.photo.update({
        where: { id: photo.id },
        data: { driveFileId: fileId, imageData: "", thumbnailData: "" },
      });
      moved += 1;
    }
    // 예전에 드라이브로 복사만 하고 DB에 남겨 두었던 이미지 데이터도 비웁니다.
    const cleared = await prisma.photo.updateMany({
      where: { driveFileId: { not: null }, OR: [{ imageData: { not: "" } }, { thumbnailData: { not: "" } }] },
      data: { imageData: "", thumbnailData: "" },
    });
    if (moved || cleared.count) {
      console.log(`Moved ${moved} photos to Google Drive and cleared ${cleared.count} copied photos from the DB.`);
      // 사진 표를 잠깐 잠그지만, 이미지 데이터를 비운 뒤라 금방 끝납니다.
      await prisma.$executeRawUnsafe('VACUUM FULL "prayer_log_photos"');
      console.log("Vacuumed prayer_log_photos.");
    }
  } catch (err) {
    console.error("Moving photos to Google Drive stopped:", err);
  } finally {
    migrating = false;
  }
}

export default router;
