// Centralized config for the extension.
// VITE_API_URL can be set in apps/extension/.env or .env.local
// Defaults to http://localhost:3000 for local development.

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const API_BASE = `${API_BASE_URL}/api`;
