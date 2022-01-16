import { getConf } from "@fs-access/conf";
import { readServersJson, writeServersJson, Servers, Server } from "@fs-access/server";
import { clone } from "@backend/utils/utils";

let db: Servers | undefined;

function getDb(): Servers {
  if (db === undefined) {
    // read json database
    db = readServersJson();

    if (db === undefined) {
      db = {
        nextPort: getConf().portsRange[0],
        nextRconPort: getConf().rconPortsRange[0],
        instances: [],
      };
      flush();
    }
  }
  return db;
}

function flush() {
  if (db !== undefined) {
    writeServersJson(db);
  }
}

/* Exported functions */

export function getNextPort(): number {
  return getDb().nextPort || getConf().portsRange[0];
}

export function setNextPort(port: number) {
  getDb().nextPort = port;
  flush();
}

export function getNextRconPort(): number {
  return getDb().nextRconPort || getConf().rconPortsRange[0];
}

export function setNextRconPort(port: number) {
  getDb().nextRconPort = port;
  flush();
}

export function createServer(server: Server) {
  getDb().instances.push(server);
  flush();
}

export function updateServer(newServer: Server) {
  const servers = getDb().instances;
  for (const idx in servers) {
    if (servers[idx].uuid === newServer.uuid) {
      servers[idx] = newServer;
      break;
    }
  }

  flush();
}

export function removeServer(uuid: string) {
  const servers = getDb().instances;
  for (let idx = 0; idx < servers.length; idx++) {
    if (servers[idx].uuid === uuid) {
      servers.splice(idx, 1);
      break;
    }
  }

  flush();
}

export function listServers(): Server[] {
  return clone(getDb().instances);
}

export function getServerByUuid(uuid: string): Server {
  const result = getDb().instances.filter((s) => s.uuid === uuid);
  if (result.length > 1) {
    throw new Error("Multiple results found");
  }
  return clone(result[0]);
}
