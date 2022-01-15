import { fetchJson } from "./fetcher";

export interface ServerDTO {
  id: string;
  name: string;
  note?: string;
  version: string;
  creationDate: Date;
  status: "provisioning" | "created" | "creation_error" | "deleting" | "deleted";
  errorMessage?: string;
  port: number;
  running: boolean;
  stopping: boolean;
}

function refineServer(server: ServerDTO): ServerDTO {
  server.creationDate = new Date(server.creationDate);
  return server;
}

export async function listServers(): Promise<ServerDTO[]> {
  const result = (await (await fetchJson("GET", "/servers")).json()) as ServerDTO[];
  return result.map((i) => refineServer(i));
}

export async function getServer(id: string): Promise<ServerDTO> {
  return refineServer((await (await fetchJson("GET", "/servers/" + id)).json()) as ServerDTO);
}

export async function startServer(uuid: string) {
  await fetchJson("POST", "/servers/" + uuid + "/start");
}

export async function stopServer(uuid: string) {
  await fetchJson("POST", "/servers/" + uuid + "/stop");
}

export async function createServer(name: string, version?: string) {
  return (
    await fetchJson("POST", "/servers", JSON.stringify({ name, version }), "application/json")
  ).text();
}
