import {
  getFieldActivityPayload,
  hasFieldActivityEnvelope,
  normalizeDirectorSchoolFieldActivity,
} from "./normalizers";
import type {
  DirectorSchoolFieldActivityData,
  DirectorSchoolFieldActivityParams,
} from "./types";

export type * from "./types";
export * from "./normalizers";

const endpoint = "crm.api.director_school_field_activity.get_director_school_field_activity";

export class DirectorSchoolFieldActivityApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "DirectorSchoolFieldActivityApiError";
  }
}

function frappeCookieHeader(cookieHeader: string): string {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.split("=", 1)[0] === "sid")
    .join("; ");
}

function errorDetails(payload: unknown, status: number, statusText: string): { code: string; message: string } {
  const root = getFieldActivityPayload(payload);
  const error = root.error ?? (payload && typeof payload === "object" ? (payload as Record<string, unknown>).error : null);
  const errorRecord = error && typeof error === "object" ? (error as Record<string, unknown>) : {};
  const code = typeof errorRecord.code === "string"
    ? errorRecord.code
    : "DIRECTOR_SCHOOL_FIELD_ACTIVITY_UNAVAILABLE";
  const message = typeof errorRecord.message === "string"
    ? errorRecord.message
    : `Không thể tải dữ liệu hoạt động trường và thực địa (HTTP ${status}${statusText ? `: ${statusText}` : ""}).`;
  return { code, message };
}

export async function getDirectorSchoolFieldActivity(
  params: DirectorSchoolFieldActivityParams = {},
  options: { baseUrl?: string } = {},
): Promise<DirectorSchoolFieldActivityData> {
  const baseUrl = (options.baseUrl ?? process.env.NEXT_PUBLIC_FRAPPE_URL ?? "").replace(/\/+$/, "");
  if (!baseUrl) {
    throw new DirectorSchoolFieldActivityApiError(
      503,
      "DIRECTOR_SCHOOL_FIELD_ACTIVITY_UNAVAILABLE",
      "Chưa cấu hình nguồn dữ liệu hoạt động trường và thực địa.",
    );
  }

  const query = new URLSearchParams();
  if (params.admissionYear !== undefined) query.set("admissionYear", String(params.admissionYear));
  if (params.scope) query.set("scope", params.scope);
  if (params.period) query.set("period", params.period);
  if (params.activityLimit) query.set("activityLimit", String(params.activityLimit));
  if (params.upcomingLimit) query.set("upcomingLimit", String(params.upcomingLimit));
  if (params.includeDevices !== undefined) query.set("includeDevices", String(params.includeDevices));

  const headers: Record<string, string> = { Accept: "application/json" };
  if (!options.baseUrl && typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const cookieHeader = frappeCookieHeader((await cookies()).toString());
      if (cookieHeader) headers.Cookie = cookieHeader;
    } catch {
      // Outside a Next request context, for example in contract tests.
    }
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/method/${endpoint}?${query.toString()}`, {
      headers,
      ...(typeof window !== "undefined" ? { credentials: "include" as RequestCredentials } : {}),
      cache: "no-store",
    });
  } catch {
    throw new DirectorSchoolFieldActivityApiError(
      503,
      "DIRECTOR_SCHOOL_FIELD_ACTIVITY_UNAVAILABLE",
      "Không thể kết nối tới dữ liệu hoạt động trường và thực địa.",
    );
  }
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = errorDetails(payload, response.status, response.statusText);
    throw new DirectorSchoolFieldActivityApiError(response.status, error.code, error.message);
  }
  if (!hasFieldActivityEnvelope(payload)) {
    throw new DirectorSchoolFieldActivityApiError(
      502,
      "INVALID_FIELD_ACTIVITY_RESPONSE",
      "Phản hồi dữ liệu hoạt động trường và thực địa không hợp lệ.",
    );
  }

  return normalizeDirectorSchoolFieldActivity(payload);
}
