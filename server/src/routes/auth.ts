import { Router } from "express";
import { z } from "zod";
import { env } from "../env.js";
import { prisma } from "../db.js";
import { requireAuth } from "../auth/middleware.js";
import { sessionCookie, signSession } from "../auth/jwt.js";

const router = Router();

const loginSchema = z.object({
  name: z.string().trim().min(1).max(50),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "이름과 암호를 입력해주세요." });
    return;
  }

  if (parsed.data.password !== env.accessPassword) {
    res.status(401).json({ error: "암호가 올바르지 않습니다." });
    return;
  }

  const member = await prisma.member.upsert({
    where: { name: parsed.data.name },
    update: {},
    create: { name: parsed.data.name },
  });

  const token = signSession({ userId: member.id });
  res.cookie(sessionCookie.name, token, sessionCookie.options);
  res.json({ user: { id: member.id, name: member.name } });
});

router.post("/logout", (_req, res) => {
  res.clearCookie(sessionCookie.name, { path: sessionCookie.options.path });
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res) => {
  const member = await prisma.member.findUnique({ where: { id: req.userId } });
  if (!member) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ user: { id: member.id, name: member.name } });
});

export default router;
