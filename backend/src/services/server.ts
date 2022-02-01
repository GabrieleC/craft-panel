import { v4 as uuidv4 } from "uuid";
import * as AsyncLock from "async-lock";
import { execFile, spawn } from "child_process";
import { promisify } from "util";
import { readlinkSync } from "fs";
import { Rcon } from "rcon-client";

import {
  createServer,
  getNextPort,
  getNextRconPort,
  getServerByUuid,
  listServers,
  removeServer,
  setNextRconPort,
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
  rmServerDir,
} from "@fs-access/server";
import logger from "@services/logger";
import { errorToString, processExists, sleep } from "@utils/utils";
import { notifyServersChanged } from "@services/socket";

// concurrency-safe lock for servers.json file access
const lock = new AsyncLock();
async function acquireServersLock<T>(cb: () => T) {
  return lock.acquire("servers", cb);
}

export async function create(name: string, version: string, note?: string): Promise<string> {
  return acquireServersLock(() => {
    const conf = getConf();

    /* check version availability */
    if (!versionIsAvailable(version)) {
      throw new BusinessError("Version " + version + " not available");
    }

    /* generate server uuid */
    const uuid = uuidv4();

    /* allocate server port */
    const [port, nextPort] = determineNextPort(
      getNextPort(),
      conf.portsRange,
      listServers().map((i) => i.port)
    );

    if (port === null) {
      throw new BusinessError("No port available");
    } else {
      setNextRconPort(nextPort);
    }

    /* allocate server rcon port */
    const [rconPort, nextRconPort] = determineNextPort(
      getNextRconPort(),
      conf.rconPortsRange,
      listServers().map((i) => i.rconPort)
    );

    if (rconPort === null) {
      throw new BusinessError("No rcon port available");
    } else {
      setNextRconPort(nextRconPort);
    }

    /* create servers json entry */
    createServer({
      uuid,
      version,
      name,
      note,
      creationDate: new Date(),
      port,
      rconPort,
      status: "provisioning",
      stopping: false,
    });

    /* start server provisioning (asynchronous) */
    setImmediate(() => provision(uuid));

    /* notify clients (asynchronous) */
    setImmediate(notifyServersChanged);

    return uuid;
  });
}

/*
  Determine next port to allocate using the provided starting port, ports range and already used ports 
  Returns a two-elements numeric array, first element is the allocated port, second element is the next 
  port to be used for the next allocation. If no port is available, returns [null, startingPort].
*/
function determineNextPort(
  startingPort: number,
  range: [number, number],
  usedPorts: number[]
): [number | null, number] {
  let port = startingPort;
  while (usedPorts.includes(port)) {
    port++;
    if (port > range[1]) {
      port = range[0];
    }

    if (port === startingPort) {
      return [null, startingPort];
    }
  }

  const nextPort = port + 1 <= range[1] ? port + 1 : range[0];

  return [port, nextPort];
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
    await acquireServersLock(async () => {
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
    return acquireServersLock(async () => {
      // find server
      const server = getServerByUuid(uuid);

      // set eula true
      {
        const eula = readServerEula(uuid);
        eula.set("eula", "true");
        writeServerEula(uuid, eula);
      }

      // set initial server properties (override server defaults)
      {
        const properties = readServerProperties(uuid);
        properties.set("server-port", String(server.port));
        properties.set("enable-rcon", "true");
        properties.set("rcon.password", "password");
        properties.set("rcon.port", String(server.rconPort));
        properties.set("online-mode", "false");
        properties.set("spawn-protection", "0");
        writeServerProperties(uuid, properties);
      }

      // update server status
      server.status = "created";
      updateServer(server);

      // notify clients (asynchronous)
      setImmediate(notifyServersChanged);
    });
  } catch (error) {
    return acquireServersLock(async () => {
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
  return acquireServersLock(() => {
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
    // check if process working dir matches with the server one
    // this is useful to detect a PID reused for another process

    let processCwd: string;
    try {
      processCwd = readlinkSync(`/proc/${server.pid}/cwd`);
    } catch (error) {
      logger().warn("Error while reading process cwd link, " + errorToString(error));
      return false;
    }

    return processCwd === executablesPaths(uuid).cwd;
  } else {
    return true;
  }
}

export async function pingServer(uuid: string): Promise<boolean> {
  const server = getServerByUuid(uuid);

  let rcon: Rcon | undefined;
  try {
    rcon = await Rcon.connect({
      host: "localhost",
      port: server.rconPort,
      password: "password",
    });

    return true;
  } catch (error) {
    return false;
  } finally {
    if (rcon !== undefined) {
      try {
        await rcon.end();
      } catch (error) {
        logger().error(errorToString(error));
      }
    }
  }
}

export async function startServer(uuid: string) {
  return lock.acquire(uuid, async () => {
    // check if server is already running
    if (await serverIsRunning(uuid)) {
      throw new BusinessError("Server already running");
    }

    await acquireServersLock(() => {
      const server = getServerByUuid(uuid);
      server.pid = executeServer(uuid);
      server.stopping = false;
      updateServer(server);
    });

    // notify clients for running status (asynchronous)
    setImmediate(notifyServersChanged);

    // asynchronously wait to notify when server is online, or timeout
    setImmediate(async () => {
      const timeoutTs = Date.now() + 5 * 60 * 1000;
      while (Date.now() < timeoutTs) {
        await sleep(5000);
        if (await pingServer(uuid)) {
          // server is now online, notify and stop polling
          setImmediate(notifyServersChanged);
          break;
        } else if (!(await serverIsRunning(uuid))) {
          // server not yet running, stop polling
          break;
        }
      }
    });
  });
}

export async function stopServer(uuid: string, force: boolean) {
  return lock.acquire(uuid, async () => {
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
    await acquireServersLock(() => {
      const server = getServerByUuid(uuid);
      server.stopping = true;
      updateServer(server);
    });

    // wait until process exit or timeout
    const timeoutTs = Date.now() + 60000;
    while (Date.now() < timeoutTs && (await serverIsRunning(uuid))) {
      await sleep(2000);
    }

    // cleanup after stop
    if (!(await serverIsRunning(uuid))) {
      logger().info(`Server stopped, uuid: ${uuid}`);

      await acquireServersLock(() => {
        const server = getServerByUuid(uuid);
        delete server.pid;
        server.stopping = false;
        updateServer(server);
      });

      // notify clients (asynchronous)
      setImmediate(notifyServersChanged);
    } else {
      logger().warn(`Stop timeout hit for pid ${pid}, uuid: ${uuid}`);
    }
  });
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
  exec.unref(); // detach process from parent
  logger().info("Server launched, uuid: " + uuid + ", pid: " + exec.pid);

  if (exec.pid === undefined) {
    // should not happen, in case kill immediately to avoid a zombie process
    exec.kill("SIGKILL");
    throw new Error("Error launching server, empty pid! uuid = " + uuid);
  }

  return exec.pid;
}

export async function runRemoteCommand(uuid: string, command: string): Promise<string> {
  const server = getServerByUuid(uuid);

  let rcon: Rcon | undefined;
  try {
    rcon = await Rcon.connect({
      host: "localhost",
      port: server.rconPort,
      password: "password",
    });

    const result = await rcon.send(command);

    return result;
  } catch (error) {
    throw new BusinessError("Error connecting to server");
  } finally {
    if (rcon !== undefined) {
      try {
        await rcon.end();
      } catch (error) {
        logger().error(errorToString(error));
      }
    }
  }
}

export async function deleteServer(uuid: string) {
  return lock.acquire(uuid, async () => {
    // check if server is running
    const running = await serverIsRunning(uuid);
    if (running) {
      throw new BusinessError("Cannot delete server while is running, uuid: " + uuid);
    }

    // check if server is creating
    const server = getServerByUuid(uuid);
    if (server.status === "provisioning") {
      throw new BusinessError("Cannot delete server while is creating, uuid: " + uuid);
    }

    // logical delete
    acquireServersLock(() => {
      const server = getServerByUuid(uuid);
      server.status = "to_delete";
      updateServer(server);
    });

    // notify clients (asynchronous)
    setImmediate(notifyServersChanged);

    // delete server directory
    rmServerDir(uuid);

    // remove server entry
    removeServer(uuid);
  });
}
