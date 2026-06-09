export const backendBaseUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "";

const AUTH_STORAGE_KEY = "scopex_auth_token";
const SESSION_KEYS = [AUTH_STORAGE_KEY, "scopex_patient_mobile"];
const AUTH_EVENT = "scopex-auth-change";

export type StoredAuthUser = {
  userId?: string;
  patientId?: string | null;
  mobile?: string | null;
  email?: string | null;
  role?: "patient" | "admin" | "super-admin" | "super_admin" | string;
};

function notifyAuthChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function getStoredAuthToken() {
  if (typeof window === "undefined") return "";
  const sessionToken = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (sessionToken) return sessionToken;

  const legacyToken = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (legacyToken) {
    window.sessionStorage.setItem(AUTH_STORAGE_KEY, legacyToken);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return legacyToken;
  }

  return "";
}

export function storeAuthToken(token: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(AUTH_STORAGE_KEY, token);
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  notifyAuthChange();
}

export function clearAuthToken() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  notifyAuthChange();
}

export function clearClientSession() {
  if (typeof window === "undefined") return;
  SESSION_KEYS.forEach((key) => {
    window.sessionStorage.removeItem(key);
    window.localStorage.removeItem(key);
  });

  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0]?.trim();
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  });
  notifyAuthChange();
}

export async function logoutAuthSession() {
  const token = getStoredAuthToken();
  try {
    if (token) {
      await fetch(backendUrl("/auth/logout"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        keepalive: true
      });
    }
  } catch {
    // Client cleanup must still happen even if the backend is unavailable.
  } finally {
    clearClientSession();
  }
}

export function getStoredAuthUser(): StoredAuthUser | null {
  const token = getStoredAuthToken();
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return JSON.parse(window.atob(padded)) as StoredAuthUser;
  } catch {
    return null;
  }
}

export function getDashboardHrefForRole(role?: string | null) {
  if (["admin", "manager", "booking_manager", "report_manager", "finance_manager", "customer_support"].includes(String(role))) return "/admin/dashboard";
  if (role === "super-admin" || role === "super_admin") return "/super-admin/dashboard";
  return "/patient/dashboard";
}

export function onAuthChange(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(AUTH_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(AUTH_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function backendUrl(path: string) {
  if (backendBaseUrl) return `${backendBaseUrl}${path}`;
  return path;
}

export async function backendFetch(path: string, init: RequestInit = {}) {
  const token = getStoredAuthToken();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(backendUrl(path), {
    ...init,
    headers
  });
}
