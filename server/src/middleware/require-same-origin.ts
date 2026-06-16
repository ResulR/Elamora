import type { NextFunction, Request, Response } from "express";
import { config } from "../config.js";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/$/, "");
}

function getOriginFromReferer(referer: string | undefined) {
  if (!referer) {
    return null;
  }

  try {
    const url = new URL(referer);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

export function requireSameOrigin(req: Request, res: Response, next: NextFunction) {
  if (!unsafeMethods.has(req.method.toUpperCase())) {
    return next();
  }

  const origin = req.headers.origin
    ? normalizeOrigin(req.headers.origin)
    : getOriginFromReferer(req.headers.referer);

  if (origin && config.corsOrigins.includes(origin)) {
    return next();
  }

  return res.status(403).json({
    ok: false,
    error: "Forbidden",
  });
}
