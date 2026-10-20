import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../auth/middleware.js";

const router = Router();
router.use(requireAuth);

const include = { author: { select: { id: true, name: true } } } as const;

// 기간은 작성 시각(createdAt) 기준입니다. 날짜만 받으면 UTC 자정으로 계산되어 현지 날짜와
// 어긋나므로, 브라우저가 현지 자정을 기준으로 계산한 시각(startAt 이상, endBefore 미만)을 받습니다.
const listQuerySchema = z.object({
  authorId: z.string().uuid().optional(),
  startAt: z.coerce.date().optional(),
  endBefore: z.coerce.date().optional(),
});

router.get("/", async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }
  const { authorId, startAt, endBefore } = parsed.data;

  const items = await prisma.meditation.findMany({
    where: {
      ...(authorId ? { authorId } : {}),
      ...(startAt || endBefore
        ? {
            createdAt: {
              ...(startAt ? { gte: startAt } : {}),
              ...(endBefore ? { lt: endBefore } : {}),
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include,
  });
  res.json({ items });
});

const verseSchema = z
  .object({
    book: z.string().trim().min(1).max(20),
    chapter: z.number().int().min(1).max(150),
    verseStart: z.number().int().min(1).max(200),
    verseEnd: z.number().int().min(1).max(200).nullable().optional(),
    // 굵게·글자색 서식이 담긴 HTML이라 일반 텍스트보다 길어질 수 있습니다.
    content: z.string().trim().min(1).max(50000),
  })
  .refine((v) => v.verseEnd == null || v.verseEnd >= v.verseStart, {
    message: "끝 절은 시작 절보다 같거나 커야 합니다.",
  });

function normalizeVerseEnd(verseStart: number, verseEnd: number | null | undefined) {
  return verseEnd == null || verseEnd === verseStart ? null : verseEnd;
}

router.post("/", async (req, res) => {
  const parsed = verseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "말씀 구절과 내용을 확인해주세요." });
    return;
  }

  const { book, chapter, verseStart, verseEnd, content } = parsed.data;
  const item = await prisma.meditation.create({
    data: {
      book,
      chapter,
      verseStart,
      verseEnd: normalizeVerseEnd(verseStart, verseEnd),
      content,
      authorId: req.userId!,
    },
    include,
  });
  res.status(201).json({ item });
});

async function canManage(authorId: string, userId: string | undefined) {
  if (authorId === userId) return true;
  const currentUser = await prisma.member.findUnique({ where: { id: userId } });
  return Boolean(currentUser?.isLeader);
}

router.put("/:id", async (req, res) => {
  const parsed = verseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "말씀 구절과 내용을 확인해주세요." });
    return;
  }

  const existing = await prisma.meditation.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (!(await canManage(existing.authorId, req.userId))) {
    res.status(403).json({ error: "본인이 작성한 묵상만 수정할 수 있습니다." });
    return;
  }

  const { book, chapter, verseStart, verseEnd, content } = parsed.data;
  const item = await prisma.meditation.update({
    where: { id: req.params.id },
    data: { book, chapter, verseStart, verseEnd: normalizeVerseEnd(verseStart, verseEnd), content },
    include,
  });
  res.json({ item });
});

router.delete("/:id", async (req, res) => {
  const existing = await prisma.meditation.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (!(await canManage(existing.authorId, req.userId))) {
    res.status(403).json({ error: "본인이 작성한 묵상만 삭제할 수 있습니다." });
    return;
  }

  await prisma.meditation.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
