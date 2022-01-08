import { getServerByUuid } from "@data-access/server";
import { BusinessError } from "@services/common";
import { create, provision, startServer, stopServer } from "@services/server";
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

router.post("/:uuid/retry", (req, res) => {
  const uuid = req.params.uuid;

  // check server existence
  const server = getServerByUuid(uuid);
  if (!server) {
    throw new BusinessError("No server found for uuid: " + uuid);
  }

  // check server status
  if (server.status !== "creation_error") {
    throw new BusinessError("Wrong status for initialization: " + server.status);
  }

  setImmediate(() => provision(uuid)); // perform async

  res.sendStatus(200);
});

router.post("/:uuid/start", (req, res) => {
  const uuid = req.params.uuid;

  // check server existence
  const server = getServerByUuid(uuid);
  if (!server) {
    throw new BusinessError("No server found for uuid: " + uuid);
  }

  startServer(uuid);

  res.sendStatus(200);
});

router.post("/:uuid/stop", (req, res) => {
  const uuid = req.params.uuid;

  // check server existence
  const server = getServerByUuid(uuid);
  if (!server) {
    throw new BusinessError("No server found for uuid: " + uuid);
  }

  setImmediate(() => stopServer(uuid, false));

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
