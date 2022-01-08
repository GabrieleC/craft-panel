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
  return getDb().nextPort;
}

export function setNextPort(port: number) {
  getDb().nextPort = port;
  flush();
}

export function createServer(server: Server) {
  getDb().instances.push(server);
  flush();
}

export function updateServer(newServer: Server) {
  const servers = getDb().instances.filter((s) => s.uuid === newServer.uuid);
  if (servers.length > 1) {
    throw new Error("Multiple results found");
  }

  const server = servers[0];

  server.creationDate = newServer.creationDate;
  server.errorMessage = newServer.errorMessage;
  server.name = newServer.name;
  server.note = newServer.note;
  server.port = newServer.port;
  server.status = newServer.status;
  server.uuid = newServer.uuid;

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
