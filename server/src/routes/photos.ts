import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../auth/middleware.js";
import { endOfDayExclusive } from "../utils/date.js";

const router = Router();
router.use(requireAuth);

const photoSummarySelect = {
  id: true,
  caption: true,
  photoDate: true,
  thumbnailData: true,
  createdAt: true,
  author: { select: { id: true, name: true } },
} as const;

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
  res.json({ items });
});

router.get("/:id", async (req, res) => {
  const photo = await prisma.photo.findUnique({
    where: { id: req.params.id },
    include: { author: { select: { id: true, name: true } } },
  });
  if (!photo) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ item: photo });
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

  const item = await prisma.photo.create({
    data: {
      caption: parsed.data.caption,
      photoDate: parsed.data.photoDate ?? new Date(),
      thumbnailData: parsed.data.thumbnailData,
      imageData: parsed.data.imageData,
      authorId,
    },
    select: photoSummarySelect,
  });
  res.status(201).json({ item });
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
  res.status(204).send();
});

export default router;
