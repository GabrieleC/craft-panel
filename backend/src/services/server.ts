import { v4 as uuidv4 } from "uuid";
import * as AsyncLock from "async-lock";
import { execFile, spawn } from "child_process";
import { promisify } from "util";

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
  writePidFile,
  readPidFile,
  deletePidFile,
  executablesPaths,
} from "@fs-access/server";
import logger from "@services/logger";
import { processExists, sleep } from "@utils/utils";

// concurrency-safe lock for servers.json file access
const lock = new AsyncLock();
const SERVERS_LOCK_KEY = "servers";

export async function create(name: string, version: string, note?: string): Promise<string> {
  return lock.acquire(SERVERS_LOCK_KEY, () => {
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
  });
}

export async function provision(uuid: string) {
  const unlock = await lock.acquire(SERVERS_LOCK_KEY, () => {
    return new Promise<() => void>((resolve, reject) => {
      return () => resolve(() => null);
    });
  });

  unlock();

  try {
    await lock.acquire(SERVERS_LOCK_KEY, async () => {
      // find server
      const server = getServerByUuid(uuid);

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
    });

    // perform server initialization (release lock to avoid blocking other operations)
    {
      const initLog = await executeServerInit(uuid);
      writeInitLog(uuid, initLog);
    }

    // post-initialization phase
    return lock.acquire(SERVERS_LOCK_KEY, async () => {
      // find server
      const server = getServerByUuid(uuid);

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
    });
  } catch (error) {
    return lock.acquire(SERVERS_LOCK_KEY, async () => {
      logger().error("Error during server provisioning for uuid " + uuid + ": " + error);
      const server = getServerByUuid(uuid);
      if (error instanceof Error) {
        server.errorMessage = error.message;
      }
      server.status = "creation_error";
      updateServer(server);
    });
  }
}

export async function update(uuid: string, name: string, note: string) {
  return lock.acquire(SERVERS_LOCK_KEY, () => {
    const server = getServerByUuid(uuid);
    server.name = name;
    server.note = note;
    updateServer(server);
  });
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

export async function executeServerInit(uuid: string): Promise<string> {
  const server = getServerByUuid(uuid);
  const paths = executablesPaths(uuid);

  logger().info("Executing initialization for server uuid: " + uuid);
  const exec = await promisify(execFile)(paths.jre, ["-jar", paths.jar, "--initSettings"], {
    windowsHide: true,
    cwd: paths.cwd,
  });
  logger().info("Initialization completed for server uuid: " + uuid);

  return exec.stdout;
}

export function executeServer(uuid: string): number {
  const server = getServerByUuid(uuid);
  const paths = executablesPaths(uuid);

  logger().info("Launching server uuid: " + uuid);
  const exec = spawn(paths.jre, ["-jar", paths.jar, "--nogui", "--port", String(server.port)], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
    cwd: paths.cwd,
  });
  logger().info("Server launched, uuid: " + uuid + ", pid: " + exec.pid);

  if (exec.pid === undefined) {
    // should not happen, in case kill immediately to avoid a zombie process
    exec.kill("SIGKILL");
    throw new Error("Error launching server, empty pid! uuid = " + uuid);
  }

  return exec.pid;
}
