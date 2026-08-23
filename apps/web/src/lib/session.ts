export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("hirnao_token");
}

export function setToken(token: string) {
  localStorage.setItem("hirnao_token", token);
}

export function clearToken() {
  localStorage.removeItem("hirnao_token");
  localStorage.removeItem("hirnao_user");
}

export function getStoredUser<T>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("hirnao_user");
  return raw ? (JSON.parse(raw) as T) : null;
}

export function setStoredUser(user: unknown) {
  localStorage.setItem("hirnao_user", JSON.stringify(user));
}
