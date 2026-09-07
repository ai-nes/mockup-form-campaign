import {
  computeDirectorDemographicsOverview,
  computeDirectorDemographicsSegment,
} from "./data";
import type {
  DirectorDemographicsOverviewParams,
  DirectorDemographicsOverviewResponse,
  DirectorDemographicsSegmentParams,
  DirectorDemographicsSegmentResponse,
} from "./types";

export type * from "./types";
export * from "./data";

export class DirectorDemographicsApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "DirectorDemographicsApiError";
  }
}

function frappeCookieHeader(cookieHeader: string): string {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.split("=", 1)[0] === "sid")
    .join("; ");
}

function hasDemographicsOverviewEnvelope(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const root = value as Record<string, unknown>;
  const payload =
    "message" in root && root.message && typeof root.message === "object"
      ? (root.message as Record<string, unknown>)
      : root;
  const data = payload.data as Record<string, unknown> | undefined;
  const meta = payload.meta as Record<string, unknown> | undefined;

  return (
    !!data &&
    typeof data === "object" &&
    Array.isArray(data.kpis) &&
    typeof data.demand === "object" &&
    typeof data.audienceComposition === "object" &&
    Array.isArray(data.segments) &&
    !!data.acquisitionMap &&
    typeof data.acquisitionMap === "object" &&
    Array.isArray(data.regionOpportunities) &&
    typeof data.regionalDemand === "object" &&
    Array.isArray(data.dataCoverage) &&
    !!meta &&
    typeof meta === "object" &&
    typeof meta.admissionYear === "number" &&
    typeof meta.page === "number" &&
    Number.isInteger(meta.page) &&
    meta.page >= 1 &&
    typeof meta.pageSize === "number" &&
    Number.isInteger(meta.pageSize) &&
    meta.pageSize >= 1 &&
    typeof meta.total === "number" &&
    Number.isInteger(meta.total) &&
    meta.total >= 0 &&
    typeof meta.totalPages === "number" &&
    Number.isInteger(meta.totalPages) &&
    meta.totalPages >= 1 &&
    meta.totalPages === Math.max(1, Math.ceil(meta.total / meta.pageSize)) &&
    meta.page <= meta.totalPages &&
    data.segments.length <= meta.pageSize &&
    typeof meta.hasNextPage === "boolean" &&
    meta.hasNextPage === (meta.page < meta.totalPages)
  );
}

function hasDemographicsSegmentEnvelope(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const root = value as Record<string, unknown>;
  const payload =
    "message" in root && root.message && typeof root.message === "object"
      ? (root.message as Record<string, unknown>)
      : root;
  const data = payload.data as Record<string, unknown> | undefined;
  const meta = payload.meta as Record<string, unknown> | undefined;

  return (
    !!data &&
    typeof data === "object" &&
    typeof data.segment === "object" &&
    data.segment !== null &&
    typeof (data.segment as Record<string, unknown>).id === "string" &&
    typeof data.benchmark === "object" &&
    typeof data.nextAction === "object" &&
    Array.isArray(data.guardrails) &&
    !!meta &&
    typeof meta === "object" &&
    typeof meta.admissionYear === "number"
  );
}

export async function getDirectorDemographicsOverview(
  params?: DirectorDemographicsOverviewParams,
  options: { baseUrl?: string } = {},
): Promise<DirectorDemographicsOverviewResponse> {
  const searchParams = new URLSearchParams();
  if (params?.admissionYear) searchParams.set("admissionYear", String(params.admissionYear));
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.pageSize !== undefined) searchParams.set("pageSize", String(params.pageSize));
  if (params?.period) searchParams.set("period", params.period);
  if (params?.scope) searchParams.set("scope", params.scope);
  if (params?.province) searchParams.set("province", params.province);
  if (params?.major) searchParams.set("major", params.major);
  if (params?.stage) searchParams.set("stage", params.stage);
  if (params?.priority) searchParams.set("priority", params.priority);
  if (params?.owner) searchParams.set("owner", params.owner);
  if (params?.sourceGroup) searchParams.set("sourceGroup", params.sourceGroup);

  const queryStr = searchParams.toString();
  const frappeBase = (options.baseUrl ?? process.env.NEXT_PUBLIC_FRAPPE_URL ?? "").replace(/\/+$/, "");

  if (!frappeBase) {
    return computeDirectorDemographicsOverview(params);
  }

  const url = `${frappeBase}/api/method/crm.api.director_demographics.get_director_demographics_overview${
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
          : "DEMOGRAPHICS_DATA_UNAVAILABLE";
    const errorMessage =
      typeof error.message === "string"
        ? error.message
        : typeof payload?.message === "string"
          ? payload.message
          : typeof payload?.exception === "string"
            ? payload.exception
            : `Lỗi HTTP ${response.status}: ${response.statusText}`;

    throw new DirectorDemographicsApiError(response.status, errorCode, errorMessage);
  }

  if (!hasDemographicsOverviewEnvelope(payload)) {
    throw new DirectorDemographicsApiError(
      502,
      "INVALID_DEMOGRAPHICS_RESPONSE",
      "Phản hồi dữ liệu phân tích người học không hợp lệ.",
    );
  }

  return (payload.message || payload) as DirectorDemographicsOverviewResponse;
}

export async function getDirectorDemographicsSegment(
  params: DirectorDemographicsSegmentParams,
  options: { baseUrl?: string } = {},
): Promise<DirectorDemographicsSegmentResponse | null> {
  const searchParams = new URLSearchParams();
  searchParams.set("segment_id", params.segment_id);
  if (params.admissionYear) searchParams.set("admissionYear", String(params.admissionYear));

  const queryStr = searchParams.toString();
  const frappeBase = (options.baseUrl ?? process.env.NEXT_PUBLIC_FRAPPE_URL ?? "").replace(/\/+$/, "");

  if (!frappeBase) {
    const mockResult = computeDirectorDemographicsSegment(params);
    return mockResult ?? null;
  }

  const url = `${frappeBase}/api/method/crm.api.director_demographics.get_director_demographics_segment${
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
      // Ignored outside request context
    }
  }

  const response = await fetch(url, {
    headers,
    ...(typeof window !== "undefined" ? { credentials: "include" as RequestCredentials } : {}),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  const error = payload?.error ?? {};

  if (response.status === 404 && (error.code === "SEGMENT_NOT_FOUND" || !error.code)) {
    return null;
  }

  if (!response.ok) {
    const errorCode =
      typeof error.code === "string"
        ? error.code
        : typeof payload?.exception === "string"
          ? payload.exception
          : "SEGMENT_DATA_UNAVAILABLE";
    const errorMessage =
      typeof error.message === "string"
        ? error.message
        : typeof payload?.message === "string"
          ? payload.message
          : typeof payload?.exception === "string"
            ? payload.exception
            : `Lỗi HTTP ${response.status}: ${response.statusText}`;

    throw new DirectorDemographicsApiError(response.status, errorCode, errorMessage);
  }

  if (!hasDemographicsSegmentEnvelope(payload)) {
    throw new DirectorDemographicsApiError(
      502,
      "INVALID_SEGMENT_RESPONSE",
      "Phản hồi dữ liệu phân khúc người học không hợp lệ.",
    );
  }

  return (payload.message || payload) as DirectorDemographicsSegmentResponse;
}

