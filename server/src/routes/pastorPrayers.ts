import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../auth/middleware.js";
import { endOfDayExclusive } from "../utils/date.js";

const router = Router();
router.use(requireAuth);

async function requireCurator(userId: string | undefined) {
  const currentUser = await prisma.member.findUnique({ where: { id: userId } });
  return Boolean(currentUser?.isAdmin || currentUser?.isLeader);
}

const listQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

router.get("/", async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }
  const { startDate, endDate } = parsed.data;

  const items = await prisma.pastorPrayer.findMany({
    where:
      startDate || endDate
        ? {
            prayerDate: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lt: endOfDayExclusive(endDate) } : {}),
            },
          }
        : {},
    orderBy: { prayerDate: "desc" },
    include: { recordedBy: { select: { id: true, name: true } } },
  });
  res.json({ items });
});

const createSchema = z.object({
  content: z.string().trim().min(1).max(10000),
  prayerDate: z.coerce.date().optional(),
});

router.post("/", async (req, res) => {
  if (!(await requireCurator(req.userId))) {
    res.status(403).json({ error: "웹관리자 또는 목자만 등록할 수 있습니다." });
    return;
  }

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "내용을 입력해주세요." });
    return;
  }

  const item = await prisma.pastorPrayer.create({
    data: {
      content: parsed.data.content,
      prayerDate: parsed.data.prayerDate ?? new Date(),
      recordedById: req.userId!,
    },
    include: { recordedBy: { select: { id: true, name: true } } },
  });
  res.status(201).json({ item });
});

const updateSchema = z.object({
  content: z.string().trim().min(1).max(10000).optional(),
  prayerDate: z.coerce.date().optional(),
});

router.patch("/:id", async (req, res) => {
  if (!(await requireCurator(req.userId))) {
    res.status(403).json({ error: "웹관리자 또는 목자만 수정할 수 있습니다." });
    return;
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const existing = await prisma.pastorPrayer.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const item = await prisma.pastorPrayer.update({
    where: { id: req.params.id },
    data: parsed.data,
    include: { recordedBy: { select: { id: true, name: true } } },
  });
  res.json({ item });
});

router.delete("/:id", async (req, res) => {
  if (!(await requireCurator(req.userId))) {
    res.status(403).json({ error: "웹관리자 또는 목자만 삭제할 수 있습니다." });
    return;
  }

  const existing = await prisma.pastorPrayer.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await prisma.pastorPrayer.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
