import { fetchJson } from "./fetcher";

export interface ServerDTO {
  id: string;
  name: string;
  owner: string;
  note?: string;
  version: string;
  creationDate: Date;
  status: "provisioning" | "created" | "creation_error" | "to_delete";
  errorMessage?: string;
  initLog?: string;
  port: number;
  running: boolean;
  stopping: boolean;
  online: boolean;
  players?: number;
  upgradable?: string;
}

export interface PropertiesDTO {
  [keys: string]: string;
}

function refineServer(server: ServerDTO): ServerDTO {
  server.creationDate = new Date(server.creationDate);
  return server;
}

export async function createServer(params: { name: string; version?: string; seed?: string }) {
  return (await fetchJson("POST", "/servers", JSON.stringify(params), "application/json")).text();
}

export async function retryCreate(uuid: string) {
  return fetchJson("POST", "/servers/" + uuid + "/retry");
}

export async function listServers(): Promise<ServerDTO[]> {
  const result = (await (await fetchJson("GET", "/servers")).json()) as ServerDTO[];
  return result.map((i) => refineServer(i));
}

export async function getServer(uuid: string): Promise<ServerDTO> {
  return refineServer((await (await fetchJson("GET", "/servers/" + uuid)).json()) as ServerDTO);
}

export async function updateServer(uuid: string, name?: string, note?: string) {
  await fetchJson("PUT", "/servers/" + uuid, JSON.stringify({ name, note }), "application/json");
}

export async function deleteServer(uuid: string) {
  await fetchJson("DELETE", "/servers/" + uuid);
}

export async function startServer(uuid: string) {
  await fetchJson("POST", "/servers/" + uuid + "/start");
}

export async function stopServer(uuid: string, force?: boolean) {
  await fetchJson("POST", "/servers/" + uuid + "/stop" + (force ? "?force=true" : ""));
}

export async function getServerProperties(uuid: string): Promise<PropertiesDTO> {
  return (await (await fetchJson("GET", `/servers/${uuid}/properties`)).json()) as PropertiesDTO;
}

export async function setServerProperties(uuid: string, props: PropertiesDTO) {
  return fetchJson("PUT", `/servers/${uuid}/properties`, JSON.stringify(props), "application/json");
}

export async function runCommand(uuid: string, command: string) {
  return (
    await fetchJson(
      "POST",
      `/servers/${uuid}/command`,
      JSON.stringify({ command }),
      "application/json"
    )
  ).text();
}

export async function upgradeServerVersion(uuid: string, version: string) {
  await fetchJson(
    "POST",
    "/servers/" + uuid + "/upgrade",
    JSON.stringify({ version }),
    "application/json"
  );
}
