import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export interface AdminJwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface AdminRequest extends Request {
  admin?: AdminJwtPayload;
}

export function requireAdmin(req: AdminRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.elamora_admin_token;

  if (!token) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as AdminJwtPayload;
    req.admin = payload;
    return next();
  } catch {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
}
