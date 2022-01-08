import { getServerByUuid } from "@data-access/server";
import { BusinessError } from "@services/common";
import { create, provision } from "@services/server";
import { ErrorRequestHandler, Router, json } from "express";

const router = Router();

router.use(json());

router.post("/", (req, res) => {
  // check mandatory fields
  if (!req?.body?.name) {
    throw new BusinessError("Mandatory field: name");
  }
  if (!req?.body?.version) {
    throw new BusinessError("Mandatory field: version");
  }

  const uuid = create(req.body.name, req.body.version, req.body.note);
  res.send(uuid);
});

router.post("/retry", (req, res) => {
  // check mandatory fields
  if (!req?.body?.uuid) {
    throw new BusinessError("Mandatory field: uuid");
  }

  // check server existence
  const server = getServerByUuid(req.body.uuid);
  if (!server) {
    throw new BusinessError("No server found for uuid: " + req.body.uuid);
  }

  // check server status
  if (server.status !== "creation_error") {
    throw new BusinessError("Wrong status for initialization: " + server.status);
  }

  setImmediate(() => provision(req.body.uuid)); // perform async

  res.sendStatus(200);
});

router.use(((err, req, res, next) => {
  if (err instanceof BusinessError && !res.headersSent) {
    res.status(400).contentType("text").send(err.message);
  } else {
    return next(err);
  }
}) as ErrorRequestHandler);

export default router;
