import { fetchJson } from "./fetcher";

export interface ServerDTO {
  id: string;
  name: string;
  note?: string;
  version: string;
  status: "provisioning" | "created" | "creation_error" | "deleting" | "deleted";
  port: number;
  running: boolean;
  stopping: boolean;
}

export async function listServers(): Promise<ServerDTO[]> {
  return (await fetchJson("GET", "/servers")).json();
}

export async function getServer(id: string): Promise<ServerDTO> {
  return (await fetchJson("GET", "/servers/" + id)).json();
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
