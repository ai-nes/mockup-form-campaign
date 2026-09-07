import { computeDirectorOverview } from "./data";
import { normalizeDirectorOverview } from "./normalizers";
import type {
  DirectorOverviewData,
  DirectorOverviewParams,
  DirectorOverviewResponse,
} from "./types";

export type * from "./types";
export * from "./data";
export * from "./normalizers";

export class DirectorOverviewApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "DirectorOverviewApiError";
  }
}

function hasOverviewEnvelope(value: unknown): value is { message: DirectorOverviewData } | DirectorOverviewData {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const payload = "message" in value && value.message && typeof value.message === "object"
    ? (value as { message: Record<string, unknown> }).message
    : (value as Record<string, unknown>);

  return (
    !!payload &&
    typeof payload === "object" &&
    Array.isArray(payload.kpis) &&
    typeof payload.meta === "object" &&
    typeof payload.forecast === "object" &&
    typeof payload.pipeline === "object"
  );
}

function frappeCookieHeader(cookieHeader: string): string {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.split("=", 1)[0] === "sid")
    .join("; ");
}

export async function getDirectorOverview(
  params?: DirectorOverviewParams,
  options: { baseUrl?: string } = {},
): Promise<DirectorOverviewResponse> {
  const searchParams = new URLSearchParams();
  if (params?.admissionYear) searchParams.set("admissionYear", String(params.admissionYear));
  if (params?.scope) searchParams.set("scope", params.scope);
  if (params?.trendRange) searchParams.set("trendRange", params.trendRange);

  const queryStr = searchParams.toString();
  const frappeBase = (options.baseUrl ?? process.env.NEXT_PUBLIC_FRAPPE_URL ?? "").replace(/\/+$/, "");

  if (!frappeBase) {
    return computeDirectorOverview(params);
  }

  const url = `${frappeBase}/api/method/crm.api.director_dashboard.get_director_overview${
    queryStr ? `?${queryStr}` : ""
  }`;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (!options.baseUrl && typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const cookieHeader = frappeCookieHeader((await cookies()).toString());
      if (cookieHeader) {
        headers.Cookie = cookieHeader;
      }
    } catch {
      // Ignored outside request context (e.g., tests)
    }
  }

  const response = await fetch(url, {
    headers,
    ...(typeof window !== "undefined" ? { credentials: "include" as RequestCredentials } : {}),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = payload?.error ?? {};
    const errorCode =
      typeof error.code === "string"
        ? error.code
        : typeof payload?.exception === "string"
          ? payload.exception
          : "DIRECTOR_OVERVIEW_UNAVAILABLE";
    const errorMessage =
      typeof error.message === "string"
        ? error.message
        : typeof payload?.message === "string"
          ? payload.message
          : typeof payload?.exception === "string"
            ? payload.exception
            : `Lỗi HTTP ${response.status}: ${response.statusText}`;

    throw new DirectorOverviewApiError(response.status, errorCode, errorMessage);
  }

  if (!hasOverviewEnvelope(payload)) {
    throw new DirectorOverviewApiError(
      502,
      "INVALID_OVERVIEW_RESPONSE",
      "Phản hồi dữ liệu tổng quan tuyển sinh không hợp lệ.",
    );
  }

  return normalizeDirectorOverview(payload);
}

