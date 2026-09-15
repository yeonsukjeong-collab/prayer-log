import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../auth/middleware.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  const items = await prisma.prayerRequest.findMany({
    orderBy: [{ isAnswered: "asc" }, { createdAt: "desc" }],
    include: { author: { select: { id: true, name: true } } },
  });
  res.json({ items });
});

const createSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  authorId: z.string().uuid().optional(),
});

router.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "내용을 입력해주세요." });
    return;
  }

  let authorId = req.userId!;
  if (parsed.data.authorId && parsed.data.authorId !== req.userId) {
    const currentUser = await prisma.member.findUnique({ where: { id: req.userId } });
    if (!currentUser?.isLeader) {
      res.status(403).json({ error: "다른 사람 이름으로 등록할 권한이 없습니다." });
      return;
    }
    const target = await prisma.member.findUnique({ where: { id: parsed.data.authorId } });
    if (!target) {
      res.status(400).json({ error: "대상을 찾을 수 없습니다." });
      return;
    }
    authorId = target.id;
  }

  const item = await prisma.prayerRequest.create({
    data: { content: parsed.data.content, authorId },
    include: { author: { select: { id: true, name: true } } },
  });
  res.status(201).json({ item });
});

const updateSchema = z.object({
  content: z.string().trim().min(1).max(2000).optional(),
  isAnswered: z.boolean().optional(),
  answeredNote: z.string().trim().max(2000).nullable().optional(),
});

router.patch("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const existing = await prisma.prayerRequest.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (existing.authorId !== req.userId) {
    const currentUser = await prisma.member.findUnique({ where: { id: req.userId } });
    if (!currentUser?.isLeader) {
      res.status(403).json({ error: "본인이 작성한 기도제목만 수정할 수 있습니다." });
      return;
    }
  }

  const { content, isAnswered, answeredNote } = parsed.data;
  const item = await prisma.prayerRequest.update({
    where: { id: req.params.id },
    data: {
      ...(content !== undefined ? { content } : {}),
      ...(isAnswered !== undefined
        ? { isAnswered, answeredAt: isAnswered ? new Date() : null }
        : {}),
      ...(answeredNote !== undefined ? { answeredNote } : {}),
    },
    include: { author: { select: { id: true, name: true } } },
  });
  res.json({ item });
});

router.delete("/:id", async (req, res) => {
  const existing = await prisma.prayerRequest.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (existing.authorId !== req.userId) {
    const currentUser = await prisma.member.findUnique({ where: { id: req.userId } });
    if (!currentUser?.isLeader) {
      res.status(403).json({ error: "본인이 작성한 기도제목만 삭제할 수 있습니다." });
      return;
    }
  }

  await prisma.prayerRequest.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
