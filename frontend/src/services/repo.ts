import { fetchJson } from "./fetcher";

export async function listVersions(): Promise<string[]> {
  return (await fetchJson("GET", "/versions")).json();
}
