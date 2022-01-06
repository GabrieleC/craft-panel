import { resolveServersJsonPath } from "@fs-access/server";
import { Low, JSONFile } from "lowdb";

export interface Server {
  uuid: String;
  name: String;
  note?: String;
  creationDate: Date;
  port: number;
  status: "provisioning" | "created" | "creation_error" | "deleting" | "deleted";
  errorMessage?: String;
}

let db: Low<Server[]> | undefined;

export async function initDb() {
  db = new Low<Server[]>(new JSONFile(resolveServersJsonPath()));
  await db.read();
}

function data(): Server[] {
  if (db !== undefined) {
    return db.data || [];
  } else {
    throw new Error("servers json db not initialized");
  }
}

async function flush() {
  if (db !== undefined) {
    await db.write();
  } else {
    throw new Error("servers json db not initialized");
  }
}

export async function createServer(server: Server) {
  data().push(server);
  await flush();
}
