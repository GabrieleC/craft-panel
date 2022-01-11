import { BusinessError } from "@services/common";
import { ErrorRequestHandler } from "express";

export const businessErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof BusinessError && !res.headersSent) {
    res.status(400).contentType("text").send(err.message);
  } else {
    return next(err);
  }
};
