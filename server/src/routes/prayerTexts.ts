import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../auth/middleware.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  const items = await prisma.prayerText.findMany({
    orderBy: { meetingDate: "desc" },
    include: { author: { select: { id: true, name: true } } },
  });
  res.json({ items });
});

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(10000),
  meetingDate: z.coerce.date().optional(),
});

router.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "제목과 내용을 입력해주세요." });
    return;
  }

  const item = await prisma.prayerText.create({
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      meetingDate: parsed.data.meetingDate ?? new Date(),
      authorId: req.userId!,
    },
    include: { author: { select: { id: true, name: true } } },
  });
  res.status(201).json({ item });
});

const updateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().trim().min(1).max(10000).optional(),
  meetingDate: z.coerce.date().optional(),
});

router.patch("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const existing = await prisma.prayerText.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (existing.authorId !== req.userId) {
    res.status(403).json({ error: "본인이 작성한 기도문만 수정할 수 있습니다." });
    return;
  }

  const item = await prisma.prayerText.update({
    where: { id: req.params.id },
    data: parsed.data,
    include: { author: { select: { id: true, name: true } } },
  });
  res.json({ item });
});

router.delete("/:id", async (req, res) => {
  const existing = await prisma.prayerText.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (existing.authorId !== req.userId) {
    res.status(403).json({ error: "본인이 작성한 기도문만 삭제할 수 있습니다." });
    return;
  }

  await prisma.prayerText.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
