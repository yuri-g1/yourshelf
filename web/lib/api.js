import { useEffect, useState } from "react";

export class ApiError extends Error {
  constructor(status, data) {
    super(data?.error || `Request failed (${status})`);
    this.status = status;
    this.data = data;
  }
}

const OFFLINE_MESSAGE = "We can't reach the server right now. Check your connection and try again in a moment.";

export async function api(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
    });
  } catch {
    throw offline(0);
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status >= 500 && !data?.error) throw offline(response.status);
    throw new ApiError(response.status, data);
  }

  return data;
}

function offline(status) {
  const error = new ApiError(status, { error: OFFLINE_MESSAGE });
  error.offline = true;
  return error;
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
