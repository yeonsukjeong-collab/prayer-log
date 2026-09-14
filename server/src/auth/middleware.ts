import type { NextFunction, Request, Response } from "express";
import { sessionCookie, verifySession } from "./jwt.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[sessionCookie.name];
  const session = token ? verifySession(token) : null;

  if (!session) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  req.userId = session.userId;
  next();
}
