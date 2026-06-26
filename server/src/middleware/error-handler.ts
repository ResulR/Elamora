import type {
  NextFunction,
  Request,
  Response,
} from "express";
import { logError } from "../logger.js";

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (res.headersSent) {
    return next(error);
  }

  logError(error, "unhandled_request_error", {
    method: req.method,
    path: req.path,
  });

  return res.status(500).json({
    ok: false,
    error: "internal_error",
  });
}
