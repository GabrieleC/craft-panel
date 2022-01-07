import { v4 as uuidv4 } from "uuid";

import { Server } from "@data-access/server";

export async function createServer(): Promise<string> {
  const uuid = uuidv4();

  return uuid;
}

export async function provision(server: Server) {}
