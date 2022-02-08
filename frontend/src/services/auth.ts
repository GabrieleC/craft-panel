import { fetchJson } from "./fetcher";

export async function login(password: string, user: string): Promise<boolean> {
  const response = await fetchJson(
    "POST",
    "/auth/login",
    JSON.stringify({ user, password }),
    "application/json"
  );

  return (await response.text()) === "true";
}
