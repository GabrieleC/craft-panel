import { getServerByUuid, listServers } from "@data-access/server";
import { getConf } from "@fs-access/conf";
import { readServerProperties, Server, writeServerProperties } from "@fs-access/server";
import { BusinessError } from "@services/common";
import {
  create,
  provision,
  serverIsRunning,
  startServer,
  stopServer,
  update,
} from "@services/server";
import { Properties, Property } from "@utils/properties";
import { mandatoryField } from "@utils/utils";
import { Router, json } from "express";
import { businessErrorHandler } from "./commons";

const router = Router();

router.use(json());

router.post("/", (req, res) => {
  mandatoryField(req?.body?.name, "name");

  const version = req?.body?.version || getConf().defaultVersion;

  const uuid = create(req.body.name, version, req.body.note);
  res.send(uuid);
});

router.put("/:uuid", (req, res) => {
  mandatoryField(req?.body?.name, "name");
  mandatoryField(req?.body?.note, "note");
  const uuid = req.params.uuid;

  // check server existence
  const server = getServerByUuid(uuid);
  if (!server) {
    throw new BusinessError("No server found for uuid: " + uuid);
  }

  update(req.params.uuid, req.body.name, req.body.note);
  res.sendStatus(200);
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
  const force = Boolean(req.query.force) || false;

  // check server existence
  const server = getServerByUuid(uuid);
  if (!server) {
    throw new BusinessError("No server found for uuid: " + uuid);
  }

  // stop asynchronously
  setImmediate(() => stopServer(uuid, force));

  res.sendStatus(200);
});

router.get("/:uuid?", (req, res) => {
  interface ServerDTO {
    id: string;
    name: string;
    note?: string;
    version: string;
    status: "provisioning" | "created" | "creation_error" | "deleting" | "deleted";
    port: number;
    running: boolean;
  }
  const uuid = req.params.uuid;

  const servers: Server[] = [];
  if (uuid !== undefined) {
    servers.push(getServerByUuid(uuid));
  } else {
    servers.push(...listServers());
  }

  // map to result
  const result = [];
  for (const server of servers) {
    result.push({
      id: server.uuid,
      name: server.name,
      note: server.note,
      version: server.version,
      status: server.status,
      port: server.port,
      running: serverIsRunning(server.uuid),
    } as ServerDTO);
  }

  res.send(result);
});

interface PropertiesDTO {
  key: string;
  value: string;
}

router.get("/:uuid/properties", (req, res) => {
  const uuid = req.params.uuid;

  // check server existence
  const server = getServerByUuid(uuid);
  if (!server) {
    throw new BusinessError("No server found for uuid: " + uuid);
  }

  // read server properties and map to DTO
  const properties = readServerProperties(uuid)
    .list()
    .filter((i) => i instanceof Property)
    .map(
      (i) =>
        ({
          key: (i as Property).key,
          value: (i as Property).value,
        } as PropertiesDTO)
    );

  res.send(properties);
});

router.put("/:uuid/properties", (req, res) => {
  mandatoryField(req.body, "body");

  const uuid = req.params.uuid;

  // check server existence
  const server = getServerByUuid(uuid);
  if (!server) {
    throw new BusinessError("No server found for uuid: " + uuid);
  }

  // build properties object
  const properties = new Properties();
  for (const entry of req.body as PropertiesDTO[]) {
    properties.set(entry.key, entry.value);
  }

  writeServerProperties(uuid, properties);

  res.sendStatus(200);
});

// error handler
router.use(businessErrorHandler);

export default router;
