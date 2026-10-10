import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
const base = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
let access = "";
let refresh = "";
let refreshPending: Promise<boolean> | null = null;
// En web los tokens viven solo en memoria: no se persisten en localStorage.
export async function storeSession(tokens: {
  accessToken: string;
  refreshToken: string;
}) {
  access = tokens.accessToken;
  refresh = tokens.refreshToken;
  if (Platform.OS !== "web")
    await SecureStore.setItemAsync("kakebo.refresh", refresh);
}
export async function clearSession() {
  access = "";
  refresh = "";
  if (Platform.OS !== "web")
    await SecureStore.deleteItemAsync("kakebo.refresh");
}
async function renew() {
  if (!refresh) return false;
  try {
    const res = await fetch(base + "/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) {
      await clearSession();
      return false;
    }
    await storeSession(await res.json());
    return true;
  } catch {
    return false;
  }
}
export async function restore() {
  if (Platform.OS !== "web")
    refresh = (await SecureStore.getItemAsync("kakebo.refresh")) || "";
  return renew();
}
export async function logout() {
  try {
    if (refresh)
      await fetch(base + "/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
      });
  } finally {
    await clearSession();
  }
}
export async function api(
  path: string,
  method = "GET",
  body?: unknown,
  retry = true,
): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  let res: Response;
  try {
    res = await fetch(base + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(access ? { Authorization: "Bearer " + access } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new Error("No se pudo conectar. Revisa la API y tu conexión.");
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 401 && retry && !path.startsWith("/auth")) {
    if (!refreshPending)
      refreshPending = renew().finally(() => {
        refreshPending = null;
      });
    if (await refreshPending) return api(path, method, body, false);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      Array.isArray(data.message)
        ? data.message.join(" · ")
        : data.message || "No se pudo completar la operación",
    );
  return data;
}
