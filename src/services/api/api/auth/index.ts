import type { CurrentUser, FrappeMessage, SessionUser } from "./types";

export type * from "./types";

const FRAPPE_URL = (
  process.env.NEXT_PUBLIC_FRAPPE_URL ?? "http://localhost:8001"
).replace(/\/+$/, "");

/** Absolute URL of a Frappe whitelisted method. */
function frappeMethod(path: string, baseUrl = FRAPPE_URL): string {
  return `${baseUrl.replace(/\/+$/, "")}/api/method/${path}`;
}

/** Resolve a possibly site-relative Frappe asset path (e.g. an avatar) to an absolute URL. */
export function frappeAsset(
  path: string | null | undefined,
): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return `${FRAPPE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

/**
 * Full-page navigation to Frappe's Google entry point. Frappe issues the guest
 * session cookie, bounces through Google, then redirects the browser back to
 * `returnTo` (defaults to this dashboard's `/auth/callback`).
 */
export function startGoogleLogin(returnTo?: string): void {
  const target = returnTo ?? `${window.location.origin}/auth/callback`;
  window.location.href = `${frappeMethod("crm.api.google_auth.login")}?redirect_to=${encodeURIComponent(target)}`;
}

/**
 * Resolve the current Frappe session. Returns `null` when the caller is not
 * authenticated (guest session, or 401/403) so callers can treat "logged out"
 * as a normal state rather than an error.
 */
async function getCurrentUserFrom(baseUrl: string): Promise<CurrentUser | null> {
  let res: Response;
  try {
    res = await fetch(frappeMethod("crm.api.session.me", baseUrl), {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  } catch {
    // Network/CORS failure — surface as "not authenticated" so the guard routes to /login.
    return null;
  }

  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok)
    throw new Error(`Không lấy được phiên đăng nhập (HTTP ${res.status}).`);

  const body = (await res.json()) as FrappeMessage<
    CurrentUser & { user: string | null }
  >;
  if (!body.message || !body.message.user) return null;
  return body.message as CurrentUser;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  return getCurrentUserFrom(FRAPPE_URL);
}

/** Fetch the CSRF token bound to the browser's current Frappe session. */
export async function getCsrfToken(baseUrl = FRAPPE_URL): Promise<string | null> {
  const user = await getCurrentUserFrom(baseUrl);
  return user?.csrf_token?.trim() || null;
}

function normalizeSessionUser(value: unknown): SessionUser | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const name = String(source.name || source.email || "").trim();
  if (!name) return null;

  return {
    name,
    email: String(source.email || name),
    full_name: String(source.full_name || source.fullName || name),
    roles: Array.isArray(source.roles)
      ? source.roles.filter((role): role is string => typeof role === "string")
      : [],
    crm_profile:
      typeof source.crm_profile === "string"
        ? source.crm_profile
        : typeof source.crmProfile === "string"
          ? source.crmProfile
          : null,
  };
}

/** Lấy danh sách user CRM để dùng cho trường phân công task. */
export async function getSessionUsers(): Promise<SessionUser[]> {
  let response: Response;
  try {
    response = await fetch(frappeMethod("crm.api.session.get_users"), {
      credentials: "include",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    throw new Error("Không thể tải danh sách người phân công task.");
  }

  if (!response.ok) {
    throw new Error(`Không thể tải danh sách người phân công (HTTP ${response.status}).`);
  }

  const body = (await response.json().catch(() => null)) as FrappeMessage<unknown> | null;
  const message = body?.message;
  const messageArrays = Array.isArray(message) ? message : [];
  const rawUsers =
    (Array.isArray(messageArrays[1]) && messageArrays[1].length > 0
      ? messageArrays[1]
      : messageArrays[0]) ??
    (Array.isArray(message) ? message : []);

  const normalizedUsers = rawUsers.map((rawUser: unknown) =>
    normalizeSessionUser(rawUser),
  );
  return normalizedUsers.filter(
    (user: SessionUser | null): user is SessionUser => user !== null,
  );
}

export interface PasswordLoginResult {
  ok: boolean;
  /** User-facing message when `ok` is false. */
  error?: string;
}

/**
 * Email/password login against Frappe's core `login` endpoint. Frappe skips CSRF
 * for guest sessions, so no token is needed. On success the session cookie is set
 * on the Frappe origin and `getCurrentUser` will resolve.
 */
export async function loginWithPassword(
  usr: string,
  pwd: string,
): Promise<PasswordLoginResult> {
  let res: Response;
  try {
    res = await fetch(frappeMethod("login"), {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({ usr, pwd }),
    });
  } catch {
    return {
      ok: false,
      error: "Không kết nối được máy chủ. Vui lòng thử lại.",
    };
  }

  let data: { message?: string } = {};
  try {
    data = (await res.json()) as { message?: string };
  } catch {
    // Frappe can return an HTML error page on 5xx — fall through to the status check.
  }

  if (res.ok && data.message === "Logged In") return { ok: true };

  if (res.status === 401)
    return { ok: false, error: "Email hoặc mật khẩu không đúng." };
  return {
    ok: false,
    error: data.message || "Đăng nhập thất bại. Vui lòng thử lại.",
  };
}

/** Clear the Frappe session cookie. Errors are swallowed — the client routes to /login regardless. */
export async function logout(): Promise<void> {
  try {
    await fetch(frappeMethod("logout"), { credentials: "include" });
  } catch {
    // ignore — session may already be gone
  }
}
