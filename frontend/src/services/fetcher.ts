const useHttps = process.env.REACT_APP_USE_HTTPS === "true";
const baseUrl = (useHttps ? "https://" : "http://") + process.env.REACT_APP_BACKEND_BASE_URL;

let password = "";
let username = "";

export function setFetchCredentials(newPassword: string, newUsername: string) {
  password = newPassword;
  username = newUsername;
}

export function currentUsername() {
  return username;
}

export async function fetchJson(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: string | File | FormData,
  bodyType?: string
): Promise<Response> {
  // abort controller
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  // build headers
  const headers = new Headers();
  headers.append("Authorization", "Basic " + btoa(username + ":" + password));
  if (body && bodyType) {
    headers.append("Content-Type", bodyType);
  }

  // perform
  const result = await fetch(baseUrl + path, {
    signal: controller.signal,
    method,
    body,
    headers,
  });
  clearTimeout(timeout);

  if (!result.ok) {
    throw new Error("HTTP status: " + result.statusText);
  }

  return result;
}
