const baseUrl = process.env.REACT_APP_BACKEND_BASE_URL;

export async function fetchJson<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: string
): Promise<Response> {
  const controller = new AbortController();
  // TODO: read timeout? connection timeout?
  const timeout = setTimeout(() => controller.abort(), 5000);
  const result = await fetch(baseUrl + path, {
    signal: controller.signal,
    method,
    body,
  });
  clearTimeout(timeout);

  if (!result.ok) {
    throw new Error("HTTP status: " + result.statusText);
  }

  return result;
}
