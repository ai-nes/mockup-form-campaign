import type {
  DirectorAdmissionFunnelData,
  DirectorAdmissionFunnelParams,
  DirectorAdmissionFunnelResponse,
} from "./types";
import { normalizeDirectorAdmissionFunnel } from "./normalizers";

export type * from "./types";
export * from "./normalizers";

export class DirectorAdmissionFunnelApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "DirectorAdmissionFunnelApiError";
  }
}

function frappeCookieHeader(cookieHeader: string): string {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.split("=", 1)[0] === "sid")
    .join("; ");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getErrorDetails(payload: unknown): { code?: string; message?: string } {
  const root = asRecord(payload);
  const message = asRecord(root?.message);
  const error = asRecord(root?.error) ?? asRecord(message?.error);

  return {
    code: typeof error?.code === "string"
      ? error.code
      : typeof root?.exception === "string"
        ? root.exception
        : undefined,
    message: typeof error?.message === "string"
      ? error.message
      : typeof message?.message === "string"
        ? message.message
        : typeof root?.message === "string"
          ? root.message
          : typeof root?.exception === "string"
            ? root.exception
            : undefined,
  };
}

export async function getDirectorAdmissionFunnel(
  params: DirectorAdmissionFunnelParams = {},
  options: { baseUrl?: string } = {},
): Promise<DirectorAdmissionFunnelResponse> {
  const searchParams = new URLSearchParams();
  if (params.admissionYear !== undefined) searchParams.set("admissionYear", String(params.admissionYear));
  if (params.scope) searchParams.set("scope", params.scope);

  const baseUrl = (options.baseUrl ?? process.env.NEXT_PUBLIC_FRAPPE_URL ?? "").replace(/\/+$/, "");
  if (!baseUrl) {
    throw new DirectorAdmissionFunnelApiError(
      0,
      "FRAPPE_URL_MISSING",
      "Chưa cấu hình địa chỉ Frappe CRM API.",
    );
  }

  const query = searchParams.toString();
  const url = `${baseUrl}/api/method/crm.api.director_admission_funnel.get_director_admission_funnel${query ? `?${query}` : ""}`;
  const headers: Record<string, string> = { Accept: "application/json" };

  if (!options.baseUrl && typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const cookieHeader = frappeCookieHeader((await cookies()).toString());
      if (cookieHeader) headers.Cookie = cookieHeader;
    } catch {
      // Outside a Next request context (for example, contract tests).
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers,
      ...(typeof window !== "undefined" ? { credentials: "include" as RequestCredentials } : {}),
      cache: "no-store",
    });
  } catch {
    throw new DirectorAdmissionFunnelApiError(
      503,
      "DIRECTOR_ADMISSION_FUNNEL_UNAVAILABLE",
      "Không thể kết nối tới dữ liệu phễu tuyển sinh.",
    );
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const details = getErrorDetails(payload);
    throw new DirectorAdmissionFunnelApiError(
      response.status,
      details.code ?? "DIRECTOR_ADMISSION_FUNNEL_UNAVAILABLE",
      details.message ?? `Lỗi HTTP ${response.status}: ${response.statusText}`,
    );
  }

  try {
    return normalizeDirectorAdmissionFunnel(payload);
  } catch {
    throw new DirectorAdmissionFunnelApiError(
      502,
      "INVALID_FUNNEL_RESPONSE",
      "Phản hồi dữ liệu phễu tuyển sinh không hợp lệ.",
    );
  }
}

export type { DirectorAdmissionFunnelData };
