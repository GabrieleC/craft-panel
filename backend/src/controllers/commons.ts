import { backendPassword } from "@services/auth";
import { BusinessError } from "@services/common";
import { ErrorRequestHandler, Request, RequestHandler } from "express";

export const businessErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof BusinessError && !res.headersSent) {
    res.status(400).contentType("text").send(err.message);
  } else {
    return next(err);
  }
};

export const basicAuthHandler: RequestHandler = (req, res, next) => {
  let success = false;

  const authHeader = req.get("Authorization");
  if (authHeader && authHeader.startsWith("Basic ")) {
    const decoded = Buffer.from(authHeader.substring(6), "base64").toString("ascii");
    success = decoded.split(":")[1] === backendPassword();
  }

  if (success) {
    next();
  } else {
    res.sendStatus(401);
  }
};

export function basicAuthUser(req: Request): string {
  const authHeader = req.get("Authorization");
  if (authHeader && authHeader.startsWith("Basic ")) {
    const decoded = Buffer.from(authHeader.substring(6), "base64").toString("ascii");
    return decoded.split(":")[0];
  } else {
    return "";
  }
}
