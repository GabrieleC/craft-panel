import { backendPassword } from "@services/auth";
import { BusinessError } from "@services/common";
import { ErrorRequestHandler, RequestHandler } from "express";

export const businessErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof BusinessError && !res.headersSent) {
    res.status(400).contentType("text").send(err.message);
  } else {
    return next(err);
  }
};

export const basicAuthHandler: RequestHandler = (req, res, next) => {
  const authHeader = req.get("Authorization");

  if (
    authHeader &&
    authHeader === "Basic " + Buffer.from("user:" + backendPassword()).toString("base64")
  ) {
    next();
  } else {
    res.sendStatus(401);
  }
};
