// Server-only helper for talking to the Bifrost backend. The token lives here
// (server env), never in the browser bundle.
const BASE = (process.env.BIFROST_URL || "http://localhost:8088").replace(/\/$/, "");
const KEY = process.env.BIFROST_API_KEY || "";

export function backendFetch(path, init = {}) {
  const headers = { ...(init.headers || {}) };
  if (KEY) headers["Authorization"] = `Bearer ${KEY}`;
  return fetch(`${BASE}${path}`, { ...init, headers, cache: "no-store" });
}
