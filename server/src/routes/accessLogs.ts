import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../auth/middleware.js";
import { endOfDayExclusive } from "../utils/date.js";

// 같은 사람이 이 시간 안에 다시 접속하면(새로고침, 앱 재실행 등) 한 번으로 셉니다.
const DEDUPE_WINDOW_MS = 30 * 60 * 1000;

// 기록에 실패해도 로그인/접속 자체는 막지 않습니다.
export async function recordAccess(memberId: string) {
  try {
    const recent = await prisma.accessLog.findFirst({
      where: { memberId, createdAt: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) } },
      select: { id: true },
    });
    if (!recent) {
      await prisma.accessLog.create({ data: { memberId } });
    }
  } catch (err) {
    console.error("Failed to record access", err);
  }
}

const router = Router();
router.use(requireAuth);

const listQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

router.get("/", async (req, res) => {
  const currentUser = await prisma.member.findUnique({ where: { id: req.userId } });
  if (!currentUser?.isLeader) {
    res.status(403).json({ error: "권한이 없습니다." });
    return;
  }

  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }
  const { startDate, endDate } = parsed.data;

  const groups = await prisma.accessLog.groupBy({
    by: ["memberId"],
    where:
      startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lt: endOfDayExclusive(endDate) } : {}),
            },
          }
        : {},
    _count: { _all: true },
  });

  const members = await prisma.member.findMany({
    where: { id: { in: groups.map((g) => g.memberId) } },
    select: { id: true, name: true },
  });
  const nameById = new Map(members.map((m) => [m.id, m.name]));

  const items = groups
    .map((g) => ({ name: nameById.get(g.memberId) ?? "(알 수 없음)", count: g._count._all }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ko"));
  res.json({ items });
});

export default router;
