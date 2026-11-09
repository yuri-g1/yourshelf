import { getSession, setSession } from "./session";

export async function api(path, { method = "GET", body } = {}) {
  const user = getSession();
  const headers = {};

  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (user) headers["X-User-Id"] = user._id;

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && user) setSession(null);
    throw new Error(data?.error || `Request failed (${response.status})`);
  }

  return data;
}
