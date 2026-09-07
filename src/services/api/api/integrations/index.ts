import type {
  GetIntegrationsParams,
  IntegrationItem,
  IntegrationStatus,
  IntegrationType,
  IntegrationsResponse,
} from "./types";

export type * from "./types";

const METHOD = "crm.integrations.api.get_integrations";
const INTEGRATION_TYPES = new Set<IntegrationType>(["call", "zalo"]);
const INTEGRATION_STATUSES = new Set<IntegrationStatus>([
  "enabled",
  "disabled",
  "not_configured",
]);

export type RequestOptions = {
  baseUrl?: string;
  headers?: Record<string, string>;
};

export class IntegrationsApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "IntegrationsApiError";
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function resolveBaseUrl(options: RequestOptions): string {
  const baseUrl = (
    options.baseUrl ??
    process.env.NEXT_PUBLIC_FRAPPE_URL ??
    ""
  ).replace(/\/+$/, "");

  if (!baseUrl) {
    throw new IntegrationsApiError(
      0,
      "FRAPPE_URL_MISSING",
      "Chưa cấu hình địa chỉ Frappe CRM API.",
    );
  }

  return baseUrl;
}

function frappeCookieHeader(cookieHeader: string): string {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.split("=", 1)[0] === "sid")
    .join("; ");
}

async function requestHeaders(
  options: RequestOptions,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers ?? {}),
  };

  if (!options.baseUrl && typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const cookieHeader = frappeCookieHeader((await cookies()).toString());
      if (cookieHeader) headers.Cookie = cookieHeader;
    } catch {
      // Outside a Next request context (for example, contract tests).
    }
  }

  return headers;
}

function unwrapMessage(value: unknown): Record<string, unknown> {
  const root = asRecord(value) ?? {};
  return asRecord(root.message) ?? root;
}

function errorDetails(
  value: unknown,
  status: number,
): { code: string; message: string } {
  const root = asRecord(value);
  const error = asRecord(root?.error);
  const message = asRecord(root?.message);

  return {
    code:
      status === 417
        ? "INVALID_INTEGRATION_TYPE"
        : typeof error?.code === "string"
          ? error.code
          : typeof root?.exc_type === "string"
            ? root.exc_type
            : `HTTP_${status}`,
    message:
      (typeof error?.message === "string" && error.message) ||
      (typeof message?.message === "string" && message.message) ||
      (typeof root?.message === "string" && root.message) ||
      (typeof root?.exception === "string" && root.exception) ||
      `Không thể tải trạng thái tích hợp (${status}).`,
  };
}

function isIntegrationType(value: unknown): value is IntegrationType {
  return (
    typeof value === "string" && INTEGRATION_TYPES.has(value as IntegrationType)
  );
}

function normalizeIntegration(value: unknown): IntegrationItem | null {
  const source = asRecord(value);
  if (
    !source ||
    !isIntegrationType(source.type) ||
    typeof source.provider !== "string" ||
    typeof source.label !== "string" ||
    typeof source.enabled !== "boolean" ||
    typeof source.status !== "string" ||
    !INTEGRATION_STATUSES.has(source.status as IntegrationStatus)
  ) {
    return null;
  }

  return {
    type: source.type,
    provider: source.provider,
    label: source.label,
    enabled: source.enabled,
    status: source.status as IntegrationStatus,
  };
}

function normalizeResponse(value: unknown): IntegrationsResponse {
  const payload = unwrapMessage(value);
  const meta = asRecord(payload.meta);
  const rawItems = payload.data;
  const requestedType = meta?.requested_type;
  const returnedTypes = meta?.returned_types;

  if (
    !Array.isArray(rawItems) ||
    !meta ||
    (requestedType !== null &&
      requestedType !== undefined &&
      !isIntegrationType(requestedType)) ||
    !Array.isArray(returnedTypes) ||
    typeof meta.total !== "number" ||
    !Number.isInteger(meta.total)
  ) {
    throw new Error("Invalid integrations response");
  }

  const data = rawItems.map(normalizeIntegration);
  if (data.some((item) => item === null)) {
    throw new Error("Invalid integration item");
  }

  const normalizedReturnedTypes = returnedTypes.filter(isIntegrationType);
  if (normalizedReturnedTypes.length !== returnedTypes.length) {
    throw new Error("Invalid integration type metadata");
  }

  return {
    data: data as IntegrationItem[],
    meta: {
      requestedType: requestedType === undefined ? null : requestedType,
      returnedTypes: normalizedReturnedTypes,
      total: meta.total,
    },
  };
}

export async function getIntegrations(
  params: GetIntegrationsParams = {},
  options: RequestOptions = {},
): Promise<IntegrationsResponse> {
  const baseUrl = resolveBaseUrl(options);
  const query = new URLSearchParams();
  if (params.type) query.set("type", params.type);

  const queryString = query.toString();
  let response: Response;
  try {
    response = await fetch(
      `${baseUrl}/api/method/${METHOD}${queryString ? `?${queryString}` : ""}`,
      {
        method: "GET",
        headers: await requestHeaders(options),
        ...(typeof window !== "undefined"
          ? { credentials: "include" as RequestCredentials }
          : {}),
        cache: "no-store",
      },
    );
  } catch {
    throw new IntegrationsApiError(
      503,
      "INTEGRATIONS_API_UNAVAILABLE",
      "Không thể kết nối tới API tích hợp.",
    );
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = errorDetails(payload, response.status);
    throw new IntegrationsApiError(
      response.status,
      details.code,
      details.message,
    );
  }

  try {
    return normalizeResponse(payload);
  } catch {
    throw new IntegrationsApiError(
      502,
      "INVALID_INTEGRATIONS_RESPONSE",
      "Phản hồi trạng thái tích hợp không hợp lệ.",
    );
  }
}
