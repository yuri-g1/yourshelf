import { useEffect, useState } from "react";

export class ApiError extends Error {
  constructor(status, data) {
    super(data?.error || `Request failed (${status})`);
    this.status = status;
    this.data = data;
  }
}

export async function api(path, { method = "GET", body } = {}) {
  const response = await fetch(`/api${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "same-origin",
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) throw new ApiError(response.status, data);

  return data;
}

export function useApi() {
  return api;
}

export function useSlow(active, delay = 3000) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!active) {
      setSlow(false);
      return;
    }

    const timer = setTimeout(() => setSlow(true), delay);
    return () => clearTimeout(timer);
  }, [active, delay]);

  return slow;
}
