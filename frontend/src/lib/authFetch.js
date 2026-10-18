import { auth } from "./firebase";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function authFetch(path, options = {}) {
  const firebaseUser = auth?.currentUser;
  if (!firebaseUser) {
    throw new Error("You must be signed in to access this account.");
  }

  const token = await firebaseUser.getIdToken();
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API}${path}`, {
    ...options,
    cache: "no-store",
    credentials: "omit",
    headers,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string" ? data.detail : "The account request failed."
    );
  }
  return data;
}
