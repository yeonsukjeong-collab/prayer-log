import jwt from "jsonwebtoken";
import { env } from "../env.js";

export interface SessionPayload {
  userId: string;
}

const COOKIE_NAME = "prayer_log_session";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "30d" });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, env.jwtSecret) as SessionPayload;
  } catch {
    return null;
  }
}

export const sessionCookie = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax" as const,
    maxAge: MAX_AGE_MS,
    path: "/",
  },
};
