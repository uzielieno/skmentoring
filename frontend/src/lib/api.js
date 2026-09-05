import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mentoring_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Une erreur est survenue. Réessaie.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

/**
 * Retourne toujours un tableau, même si l'API renvoie n'importe quoi (HTML, null,
 * objet…). Log un warning en dev si le payload est inattendu.
 */
export function safeArray(data, context = "response") {
  if (Array.isArray(data)) return data;
  // eslint-disable-next-line no-console
  console.warn(`[api] Expected array from ${context}, got:`, typeof data);
  return [];
}

/**
 * Retourne toujours un objet plain, même si l'API renvoie n'importe quoi.
 */
export function safeObject(data, context = "response") {
  if (data && typeof data === "object" && !Array.isArray(data)) return data;
  // eslint-disable-next-line no-console
  console.warn(`[api] Expected object from ${context}, got:`, typeof data);
  return {};
}
