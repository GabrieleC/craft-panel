import { Router, json } from "express";
import * as asyncHandler from "express-async-handler";

import { getServerByUuid, listServers } from "@data-access/server";
import { getConf } from "@fs-access/conf";
import {
  readInitLog,
  readServerProperties,
  Server,
  writeServerProperties,
} from "@fs-access/server";
import { BusinessError } from "@services/common";
import {
  create,
  deleteServer,
  provision,
  runRemoteCommand,
  serverIsRunning,
  startServer,
  stopServer,
  update,
  pingServer,
  upgradeVersion,
} from "@services/server";
import { Properties, Property } from "@utils/properties";
import { mandatoryField } from "@utils/utils";
import { basicAuthHandler, businessErrorHandler } from "./commons";
import logger from "@services/logger";

const router = Router();

router.use(json());

router.use(basicAuthHandler);

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

    await startServer(uuid);

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
  asyncHandler(async (req, res) => {
    interface ServerDTO {
      id: string;
      name: string;
      note?: string;
      version: string;
      creationDate: Date;
      status: "provisioning" | "created" | "creation_error" | "deleting" | "deleted";
      errorMessage: string;
      initLog?: string;
      port: number;
      running: boolean;
      stopping: boolean;
      online: boolean;
      players?: number;
      upgradable?: string;
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
      const running = await serverIsRunning(server.uuid);
      const pingResult = running ? await pingServer(server.uuid) : null;

      // read init log
      let initLog = null;
      if (server.status === "creation_error") {
        initLog = readInitLog(server.uuid);
      }

      let upgradable;
      if (server.version !== getConf().defaultVersion) {
        upgradable = getConf().defaultVersion;
      }

      result.push({
        id: server.uuid,
        name: server.name,
        note: server.note,
        version: server.version,
        creationDate: server.creationDate,
        status: server.status,
        errorMessage: server.errorMessage,
        initLog,
        port: server.port,
        running,
        stopping: running && server.stopping,
        online: pingResult !== null,
        players: pingResult?.onlinePlayers,
        upgradable,
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
  [keys: string]: string;
}

// get server properties
router.get(
  "/:uuid/properties",
  asyncHandler((req, res) => {
    const uuid = req.params.uuid;

    // check server existence
    const server = getServerByUuid(uuid);
    if (!server) {
      throw new BusinessError("No server found for uuid: " + uuid);
    }

    // read server properties
    const serverProperties = readServerProperties(uuid).list();

    // map to DTO
    const result: PropertiesDTO = {};
    for (const property of serverProperties) {
      if (property instanceof Property) {
        result[property.key] = property.value;
      }
    }

    res.send(result);
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
    for (const key in req.body as PropertiesDTO[]) {
      properties.set(key, req.body[key]);
    }

    writeServerProperties(uuid, properties);

    res.sendStatus(200);
  })
);

// send remote command
router.post(
  "/:uuid/command",
  asyncHandler(async (req, res) => {
    mandatoryField(req.body?.command, "command");

    const uuid = req.params.uuid;

    // check server existence
    const server = getServerByUuid(uuid);
    if (!server) {
      throw new BusinessError("No server found for uuid: " + uuid);
    }

    const result = await runRemoteCommand(uuid, req.body?.command);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(result);
  })
);

// delete server
router.delete(
  "/:uuid",
  asyncHandler(async (req, res) => {
    const uuid = req.params.uuid;

    // check server existence
    const server = getServerByUuid(uuid);
    if (!server) {
      throw new BusinessError("No server found for uuid: " + uuid);
    }

    logger().info("Deleting server uuid: " + uuid);
    await deleteServer(uuid);

    res.sendStatus(204);
  })
);

// upgrade version
router.post(
  "/:uuid/upgrade",
  asyncHandler(async (req, res) => {
    mandatoryField(req.body?.version, "version");

    const uuid = req.params.uuid;

    // check server existence
    const server = getServerByUuid(uuid);
    if (!server) {
      throw new BusinessError("No server found for uuid: " + uuid);
    }

    await upgradeVersion(uuid, req.body.version);

    res.sendStatus(200);
  })
);

// error handler
router.use(businessErrorHandler);

export default router;
