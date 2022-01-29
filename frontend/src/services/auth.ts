import { fetchJson } from "./fetcher";

export async function login(password: string): Promise<boolean> {
  const response = await fetchJson(
    "POST",
    "/auth/login",
    JSON.stringify({ password }),
    "application/json"
  );

  return (await response.text()) === "true";
}
