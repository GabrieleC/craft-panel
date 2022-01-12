import { Router, json } from "express";
import * as asyncHandler from "express-async-handler";

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
import { businessErrorHandler } from "./commons";

const router = Router();

router.use(json());

// create server
router.post(
  "/",
  asyncHandler(async (req, res) => {
    mandatoryField(req?.body?.name, "name");

    const version = req?.body?.version || getConf().defaultVersion;

    const uuid = await create(req.body.name, version, req.body.note);
    res.send(uuid);
  })
);

// update server
router.put(
  "/:uuid",
  asyncHandler(async (req, res) => {
    mandatoryField(req?.body?.name, "name");
    mandatoryField(req?.body?.note, "note");
    const uuid = req.params.uuid;

    // check server existence
    const server = getServerByUuid(uuid);
    if (!server) {
      throw new BusinessError("No server found for uuid: " + uuid);
    }

    await update(req.params.uuid, req.body.name, req.body.note);
    res.sendStatus(200);
  })
);

// retry provision
router.post(
  "/:uuid/retry",
  asyncHandler((req, res) => {
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
  })
);

// start server
router.post(
  "/:uuid/start",
  asyncHandler(async (req, res) => {
    const uuid = req.params.uuid;

    // check server existence
    const server = getServerByUuid(uuid);
    if (!server) {
      throw new BusinessError("No server found for uuid: " + uuid);
    }

    startServer(uuid);

    res.sendStatus(200);
  })
);

// stop server
router.post(
  "/:uuid/stop",
  asyncHandler((req, res) => {
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
  })
);

// list/detail servers
router.get(
  "/:uuid?",
  asyncHandler((req, res) => {
    interface ServerDTO {
      id: string;
      name: string;
      note?: string;
      version: string;
      status: "provisioning" | "created" | "creation_error" | "deleting" | "deleted";
      port: number;
      instance: "running" | "stopped" | "stopping";
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
      let instance = "stopped";
      if (serverIsRunning(server.uuid)) {
        instance = server.stopping ? "stopping" : "running";
      }

      result.push({
        id: server.uuid,
        name: server.name,
        note: server.note,
        version: server.version,
        status: server.status,
        port: server.port,
        instance,
      } as ServerDTO);
    }

    if (uuid !== undefined) {
      res.send(result[0]);
    } else {
      res.send(result);
    }
  })
);

interface PropertiesDTO {
  key: string;
  value: string;
}

// ger server properties
router.get(
  "/:uuid/properties",
  asyncHandler((req, res) => {
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
  })
);

// write server properties
router.put(
  "/:uuid/properties",
  asyncHandler((req, res) => {
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
  })
);

// error handler
router.use(businessErrorHandler);

export default router;
