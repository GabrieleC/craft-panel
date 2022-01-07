import { getConf } from "@fs-access/conf";
import { resolveServersJsonPath } from "@fs-access/server";
import { Low, JSONFile } from "lowdb";

interface Servers {
  nextPort: number;
  instances: Server[];
}

export interface Server {
  uuid: String;
  name: String;
  note?: String;
  creationDate: Date;
  port: number;
  status: "provisioning" | "created" | "creation_error" | "deleting" | "deleted";
  errorMessage?: String;
}

let db: Low<Servers> | undefined;

async function getDb() {
  if (db === undefined) {
    db = new Low<Servers>(new JSONFile(resolveServersJsonPath()));
    await db.read();

    if (!db.data) {
      // initialize database
      db.data = {
        nextPort: getConf().portsRange[0],
        instances: [],
      };
    }
  }
  return db;
}

async function getData(): Promise<Servers> {
  return (await getDb()).data as Servers; // cannot be null after db init
}

async function flush() {
  (await getDb()).write();
}

export async function getNextPort(): Promise<number> {
  return (await getData()).nextPort;
}

export async function createServer(server: Server) {
  (await getData()).instances.push(server);
  await flush();
}
