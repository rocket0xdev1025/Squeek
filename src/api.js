import { useEffect, useState } from "react";

const API = "https://api.squeekchain.com";

export async function apiGet(path) {
  const response = await fetch(`${API}${path}`, { headers: { accept: "application/json" } });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { error: text };
  }
  if (!response.ok) {
    const error = new Error(body?.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

export function useQuery(path, { refresh = 20000, enabled = true } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: Boolean(enabled && path) });

  useEffect(() => {
    if (!enabled || !path) return undefined;
    let stop = false;

    async function load() {
      try {
        const data = await apiGet(path);
        if (!stop) setState({ data, error: null, loading: false });
      } catch (error) {
        if (!stop) setState((current) => ({ data: current.data, error, loading: false }));
      }
    }

    load();
    const id = window.setInterval(load, refresh);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [path, refresh, enabled]);

  return state;
}
