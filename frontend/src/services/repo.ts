import { fetchJson } from "./fetcher";

export async function listVersions(): Promise<string[]> {
  return (await fetchJson("GET", "/repo/versions")).json();
}

export async function lastVersion(): Promise<string> {
  return (await fetchJson("GET", "/repo/last-version")).text();
}
