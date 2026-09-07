import { normalizeMarketOverview } from "./normalizers";
import type { DirectorMarketOverview, DirectorMarketParams } from "./types";

function frappeCookieHeader(cookieHeader: string): string {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.split("=", 1)[0] === "sid")
    .join("; ");
}

function hasMarketEnvelope(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const message = (value as { message?: unknown }).message;
  if (!message || typeof message !== "object" || Array.isArray(message)) return false;
  const data = (message as { data?: unknown }).data;
  return !!data && typeof data === "object" && !Array.isArray(data) && Array.isArray((data as { provinces?: unknown }).provinces);
}

export * from "./normalizers";
export type * from "./types";

export class DirectorMarketApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = "DirectorMarketApiError";
  }
}

export async function getDirectorMarketIntelligence(
  params: DirectorMarketParams = {},
  options: { baseUrl?: string } = {},
): Promise<DirectorMarketOverview> {
  const query = new URLSearchParams();
  if (params.admissionYear) query.set("admissionYear", String(params.admissionYear));
  if (params.period) query.set("period", params.period);
  if (params.region) query.set("region", params.region);
  if (params.metric) query.set("metric", params.metric);
  if (params.includeSchools !== undefined) query.set("includeSchools", String(params.includeSchools));
  if (params.schoolLimit) query.set("schoolLimit", String(params.schoolLimit));

  const baseUrl = (options.baseUrl ?? process.env.NEXT_PUBLIC_FRAPPE_URL ?? "").replace(/\/+$/, "");
  const method = "crm.api.director_market_intelligence.get_director_market_intelligence_overview";
  const headers: Record<string, string> = { Accept: "application/json" };
  if (!options.baseUrl) {
    try {
      const { cookies } = await import("next/headers");
      const cookieHeader = frappeCookieHeader((await cookies()).toString());
      if (cookieHeader) headers.Cookie = cookieHeader;
    } catch {
      // Outside a Next request context (for example, contract tests).
    }
  }

  const response = await fetch(`${baseUrl}/api/method/${method}?${query.toString()}`, {
    headers,
    // Client-side the session cookie rides along on the cross-origin request;
    // server-side it is forwarded explicitly via the Cookie header above.
    ...(typeof window !== "undefined" ? { credentials: "include" as RequestCredentials } : {}),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = payload?.error ?? {};
    throw new DirectorMarketApiError(
      response.status,
      typeof error.code === "string" ? error.code : "MARKET_DATA_UNAVAILABLE",
      typeof error.message === "string" ? error.message : "Không thể tải dữ liệu thị trường.",
    );
  }
  if (!hasMarketEnvelope(payload)) {
    throw new DirectorMarketApiError(502, "INVALID_MARKET_RESPONSE", "Phản hồi dữ liệu thị trường không hợp lệ.");
  }
  return normalizeMarketOverview(payload?.message ?? payload);
}
