import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../auth/middleware.js";

const router = Router();
router.use(requireAuth);

const SINGLETON_ID = "singleton";

router.get("/", async (_req, res) => {
  const item = await prisma.benediction.findUnique({
    where: { id: SINGLETON_ID },
    include: { updatedBy: { select: { id: true, name: true } } },
  });
  res.json({ item });
});

const updateSchema = z.object({
  content: z.string().trim().min(1).max(5000),
});

router.put("/", async (req, res) => {
  const currentUser = await prisma.member.findUnique({ where: { id: req.userId } });
  if (!currentUser?.isAdmin && !currentUser?.isLeader) {
    res.status(403).json({ error: "웹관리자 또는 목자만 수정할 수 있습니다." });
    return;
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "내용을 입력해주세요." });
    return;
  }

  const item = await prisma.benediction.upsert({
    where: { id: SINGLETON_ID },
    update: { content: parsed.data.content, updatedById: req.userId! },
    create: { id: SINGLETON_ID, content: parsed.data.content, updatedById: req.userId! },
    include: { updatedBy: { select: { id: true, name: true } } },
  });
  res.json({ item });
});

export default router;
