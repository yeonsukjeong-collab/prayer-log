import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../auth/middleware.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  const members = await prisma.member.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  res.json({ members });
});

export default router;
