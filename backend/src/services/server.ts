import { v4 as uuidv4 } from "uuid";
import * as AsyncLock from "async-lock";
import { execFile, spawn } from "child_process";
import { promisify } from "util";
import { readlinkSync, existsSync } from "fs";

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
  executablesPaths,
} from "@fs-access/server";
import logger from "@services/logger";
import { errorToString, processExists, sleep } from "@utils/utils";

// concurrency-safe lock for servers.json file access
const lock = new AsyncLock();
async function acquireLock<T>(cb: () => T) {
  return lock.acquire("servers", cb);
}

// const lockDomain = domain.create();
// async function acquireLock<T>(cb: () => T) {
//   return new Promise<T>((resolve) => {
//     lockDomain.run(() => {
//       resolve(lock.acquire("servers", cb));
//     });
//   });
// }

export async function create(name: string, version: string, note?: string): Promise<string> {
  return acquireLock(() => {
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
      stopping: false,
    });

    /* start server provisioning (asynchronous) */
    setImmediate(() => provision(uuid));

    return uuid;
  });
}

/*
  This function acquire lock to read/write on servers json file, but also
  performm a long running operation (server initialization). To avoid
  blocking servers json file with lock during server initialization the
  function is split into three chunks:
  - phase before initialization (locked)
  - initialization phase (not locked)
  - phase after initialization (locked)
  The function is also wrapped in a big try-catch, whose catch has its own lock
*/
export async function provision(uuid: string) {
  try {
    await acquireLock(async () => {
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

    // perform server initialization (without lock to avoid blocking other operations)
    {
      const initLog = await executeServerInit(uuid);
      writeInitLog(uuid, initLog);
    }

    // post-initialization phase
    return acquireLock(async () => {
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
    return acquireLock(async () => {
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
  return acquireLock(() => {
    const server = getServerByUuid(uuid);
    server.name = name;
    server.note = note;
    updateServer(server);
  });
}

export async function serverIsRunning(uuid: string) {
  const server = getServerByUuid(uuid);

  if (server.pid === undefined || !processExists(server.pid)) {
    return false;
  } else if (process.platform === "linux") {
    // check if jre path match, this is useful in case of pid reuse

    let processCwd = "";
    try {
      processCwd = readlinkSync(`/proc/${server.pid}/cwd`);
    } catch (error) {
      logger().warn("Error while reading process cwd link, " + errorToString(error));
      return false;
    }

    const serverCwd = executablesPaths(uuid).cwd;
    console.log("processCwd = " + processCwd + "; serverCwd: " + serverCwd);
    return serverCwd === processCwd;
  } else {
    return true;
  }
}

export async function startServer(uuid: string) {
  // check if server is already running
  if (await serverIsRunning(uuid)) {
    throw new BusinessError("Server already running");
  }

  await acquireLock(() => {
    const server = getServerByUuid(uuid);
    server.pid = executeServer(uuid);
    server.stopping = false;
    updateServer(server);
  });
}

export async function stopServer(uuid: string, force: boolean) {
  const { pid } = getServerByUuid(uuid);

  // check if server is running
  if (pid === undefined || !serverIsRunning(uuid)) {
    throw new BusinessError("Server not running");
  }

  // send signal
  logger().info(`Stopping server, uuid: ${uuid}, pid: ${pid}`);
  if (force) {
    process.kill(pid, "SIGKILL");
  } else {
    process.kill(pid, "SIGTERM");
  }

  // set server as stopping
  await acquireLock(() => {
    const server = getServerByUuid(uuid);
    server.stopping = true;
    updateServer(server);
  });

  // wait until process exit or timeout
  const timeoutTs = Date.now() + 60000;
  while ((await serverIsRunning(uuid)) && Date.now() < timeoutTs) {
    sleep(1000);
  }

  // cleanup after stop
  if (!(await serverIsRunning(uuid))) {
    await acquireLock(() => {
      const server = getServerByUuid(uuid);
      delete server.pid;
      server.stopping = false;
      updateServer(server);
    });
  } else {
    logger().warn(`Stop timeout hit for pid ${pid}, uuid: ${uuid}`);
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
