import { v4 as uuidv4 } from "uuid";

import {
  createServer,
  getNextPort,
  getServerByUuid,
  listServers,
  setNextPort,
  updateServer,
} from "@data-access/server";
import { getConf } from "@fs-access/conf";
import { compatibleJvm, versionIsAvailable } from "@services/repo";
import { BusinessError } from "@services/common";
import {
  unlinkExecutables,
  mkServerDir,
  serverDirExists,
  linkExecutables,
  writeInitLog,
  readServerEula,
  writeServerEula,
  readServerProperties,
  writeServerProperties,
  executeServerInit,
  executeServer,
  writePidFile,
  readPidFile,
  deletePidFile,
  Server,
} from "@fs-access/server";
import logger from "@services/logger";
import { processExists, sleep } from "@utils/utils";
import { Properties, Property } from "@utils/properties";

export function create(name: string, version: string, note?: string): string {
  const conf = getConf();

  /* check version availability */
  if (!versionIsAvailable(version)) {
    throw new BusinessError("Version " + version + " not available");
  }

  /* generate server uuid */
  const uuid = uuidv4();

  /* determine server port */
  let port;
  {
    const startingPort = getNextPort();
    const servers = listServers();
    const usedPorts = servers.map((s) => s.port);

    port = startingPort;
    while (usedPorts.includes(port)) {
      port++;
      if (port > conf.portsRange[1]) {
        port = conf.portsRange[0];
      }

      if (port === startingPort) {
        // all ports range tested, no available ports found
        throw new BusinessError("No port available");
      }
    }
  }

  /* update next port sequence */
  const nextPort = port + 1 <= conf.portsRange[1] ? port + 1 : conf.portsRange[0];
  setNextPort(nextPort);

  /* create servers json entry */
  createServer({
    uuid,
    version,
    name,
    note,
    creationDate: new Date(),
    port,
    status: "provisioning",
  });

  /* start server provisioning (asynchronous) */
  setImmediate(() => provision(uuid));

  return uuid;
}

export async function provision(uuid: string) {
  // find server
  const server = getServerByUuid(uuid);

  try {
    // set status and clear error
    server.status = "provisioning";
    if (server.errorMessage) {
      server.errorMessage = "";
    }
    updateServer(server);

    // create server dir
    if (!serverDirExists(uuid)) {
      mkServerDir(uuid);
    }

    // link executables
    {
      const jvm = compatibleJvm(server.version);
      unlinkExecutables(uuid); // remove existent to be idempotent
      linkExecutables(uuid, server.version, jvm);
    }

    // perform server initialization
    {
      const initLog = await executeServerInit(uuid);
      writeInitLog(uuid, initLog);
    }

    // set eula true
    {
      const eula = readServerEula(uuid);
      eula.set("eula", "true");
      writeServerEula(uuid, eula);
    }

    // set server port and offline mode
    {
      const properties = readServerProperties(uuid);
      properties.set("server-port", String(server.port));
      properties.set("online-mode", "false");
      writeServerProperties(uuid, properties);
    }

    // update server status
    server.status = "created";
    updateServer(server);
  } catch (error) {
    logger().error("Error during server provisioning for uuid " + uuid + ": " + error);
    if (error instanceof Error) {
      server.errorMessage = error.message;
    }
    server.status = "creation_error";
    updateServer(server);
  }
}

export function update(uuid: string, name: string, note: string) {
  const server = getServerByUuid(uuid);
  server.name = name;
  server.note = note;
  updateServer(server);
}

export function serverIsRunning(uuid: string) {
  const pid = readPidFile(uuid);
  return pid !== undefined && processExists(pid);
}

export function startServer(uuid: string) {
  // check if server is already running
  let pid = readPidFile(uuid);
  if (pid !== undefined) {
    if (processExists(pid)) {
      throw new BusinessError("Server already running");
    }
  }

  pid = executeServer(uuid);
  writePidFile(uuid, pid);
}

export async function stopServer(uuid: string, force: boolean) {
  // read pid file
  const pid = readPidFile(uuid);

  // check if server is running
  if (!pid || !processExists(pid)) {
    throw new BusinessError("Server not running");
  }

  // send signal
  logger().info(`Stopping server, uuid: ${uuid}, pid: ${pid}`);
  if (force) {
    process.kill(pid, "SIGKILL");
  } else {
    process.kill(pid, "SIGTERM");
  }

  // wait until process exits or timeout hits
  const startTime = Date.now();
  while (processExists(pid) && Date.now() - startTime < 60000) {
    await sleep(1000);
  }

  // if process successfully exited, delete pid file
  if (!processExists(pid)) {
    logger().info(`Server process exited, uuid: ${uuid}`);
    deletePidFile(uuid);
  } else {
    logger().warn(`Server process not exited after timeout, uuid: ${uuid}, pid: ${pid}`);
  }
}
