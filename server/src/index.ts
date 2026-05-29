import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "./config.js";
import { checkDatabase, pool } from "./db.js";
import { requireAdmin, type AdminRequest } from "./middleware/require-admin.js";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

app.get("/api/health", async (_req, res) => {
  try {
    const dbOk = await checkDatabase();

    return res.json({
      ok: true,
      db: dbOk ? "ok" : "error",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return res.status(500).json({
      ok: false,
      db: "error",
      timestamp: new Date().toISOString(),
    });
  }
});

app.post("/api/admin/login", loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Invalid credentials" });
  }

  const email = parsed.data.email.trim().toLowerCase();

  const result = await pool.query(
    "SELECT id, email, password_hash, role FROM admins WHERE lower(email) = lower($1) LIMIT 1",
    [email]
  );

  const admin = result.rows[0];

  if (!admin) {
    return res.status(401).json({ ok: false, error: "Invalid credentials" });
  }

  const passwordOk = await bcrypt.compare(parsed.data.password, admin.password_hash);

  if (!passwordOk) {
    return res.status(401).json({ ok: false, error: "Invalid credentials" });
  }

  const token = jwt.sign(
    {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    },
    config.jwtSecret,
    { expiresIn: "7d" }
  );

  res.cookie("elamora_admin_token", token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({
    ok: true,
    admin: {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    },
  });
});

app.get("/api/admin/me", requireAdmin, async (req: AdminRequest, res) => {
  return res.json({
    ok: true,
    admin: req.admin,
  });
});

app.post("/api/admin/logout", (_req, res) => {
  res.clearCookie("elamora_admin_token", {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "lax",
    path: "/",
  });

  return res.json({ ok: true });
});

app.use((_req, res) => {
  return res.status(404).json({ ok: false, error: "Not found" });
});

app.listen(config.port, "127.0.0.1", () => {
  console.log(`Elamora API listening on 127.0.0.1:${config.port}`);
});
