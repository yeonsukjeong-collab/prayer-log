import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./env.js";
import authRouter from "./routes/auth.js";
import membersRouter from "./routes/members.js";
import photosRouter from "./routes/photos.js";
import prayerRequestsRouter from "./routes/prayerRequests.js";
import prayerTextsRouter from "./routes/prayerTexts.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  }),
);
app.use(express.json({ limit: "12mb" }));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/members", membersRouter);
app.use("/api/photos", photosRouter);
app.use("/api/prayer-requests", prayerRequestsRouter);
app.use("/api/prayer-texts", prayerTextsRouter);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

if (env.nodeEnv === "production") {
  const clientDist = path.resolve(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      next();
      return;
    }
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.listen(env.port, () => {
  console.log(`Server listening on port ${env.port}`);
});
