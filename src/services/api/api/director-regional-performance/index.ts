import type {
  DirectorRegionalPerformanceParams,
  RegionalPerformanceData,
} from "./types";

export type * from "./types";

export class DirectorRegionalPerformanceApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "DirectorRegionalPerformanceApiError";
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getError(payload: unknown): { code?: string; message?: string } {
  const root = asRecord(payload);
  const error =
    asRecord(root?.error) ?? asRecord(asRecord(root?.message)?.error);
  return {
    code: typeof error?.code === "string" ? error.code : undefined,
    message:
      typeof error?.message === "string"
        ? error.message
        : typeof root?.message === "string"
          ? root.message
          : undefined,
  };
}

export async function getDirectorRegionalPerformance(
  params: DirectorRegionalPerformanceParams = {},
  options: { baseUrl?: string } = {},
): Promise<RegionalPerformanceData> {
  const baseUrl = (
    options.baseUrl ??
    process.env.NEXT_PUBLIC_FRAPPE_URL ??
    ""
  ).replace(/\/+$/, "");
  if (!baseUrl) {
    throw new DirectorRegionalPerformanceApiError(
      0,
      "FRAPPE_URL_MISSING",
      "Chưa cấu hình địa chỉ Frappe CRM API.",
    );
  }
  const query = new URLSearchParams();
  if (params.admissionYear !== undefined)
    query.set("admissionYear", String(params.admissionYear));
  if (params.scope) query.set("scope", params.scope);
  let response: Response;
  try {
    response = await fetch(
      `${baseUrl}/api/method/crm.api.director_regional_performance.get_director_regional_performance?${query}`,
      {
        headers: { Accept: "application/json" },
        credentials: "include",
        cache: "no-store",
      },
    );
  } catch {
    throw new DirectorRegionalPerformanceApiError(
      503,
      "REGIONAL_PERFORMANCE_DATA_UNAVAILABLE",
      "Không thể kết nối tới dữ liệu hiệu suất theo địa bàn.",
    );
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = getError(payload);
    throw new DirectorRegionalPerformanceApiError(
      response.status,
      error.code ?? "REGIONAL_PERFORMANCE_DATA_UNAVAILABLE",
      error.message ?? `Lỗi HTTP ${response.status}: ${response.statusText}`,
    );
  }
  const data = asRecord(payload)?.message;
  if (!isRegionalPerformanceData(data)) {
    throw new DirectorRegionalPerformanceApiError(
      502,
      "INVALID_REGIONAL_PERFORMANCE_RESPONSE",
      "Phản hồi hiệu suất theo địa bàn không hợp lệ.",
    );
  }
  return data;
}

function isRegionalPerformanceData(
  value: unknown,
): value is RegionalPerformanceData {
  const data = asRecord(value);
  return (
    !!data &&
    Array.isArray(data.provinces) &&
    Array.isArray(data.capabilityColumns) &&
    Array.isArray(data.priorityActions) &&
    !!asRecord(data.meta)
  );
}
