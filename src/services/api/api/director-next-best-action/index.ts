import type {
  ActionCommandRequest,
  ActionCommandResponse,
  DirectorNextBestActionParams,
  DirectorNextBestActionResponse,
} from "./types";
import {
  normalizeActionCommandResponse,
  normalizeDirectorNextBestAction,
} from "./normalizers";

export type * from "./types";
export { ACTION_TYPES } from "./types";
export * from "./normalizers";

const SNAPSHOT_METHOD =
  "crm.api.director_next_best_action.get_director_next_best_action";
const COMMAND_METHOD = "crm.api.director_next_best_action.apply_action_command";

type RequestOptions = { baseUrl?: string };

export class DirectorNextBestActionApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "DirectorNextBestActionApiError";
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getErrorDetails(payload: unknown): {
  code?: string;
  message?: string;
} {
  const root = asRecord(payload);
  const message = asRecord(root?.message);
  const error = asRecord(root?.error) ?? asRecord(message?.error);

  return {
    code:
      typeof error?.code === "string"
        ? error.code
        : typeof root?.exception === "string"
          ? root.exception
          : undefined,
    message:
      typeof error?.message === "string"
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

function resolveBaseUrl(options: RequestOptions): string {
  const baseUrl = (
    options.baseUrl ??
    process.env.NEXT_PUBLIC_FRAPPE_URL ??
    ""
  ).replace(/\/+$/, "");
  if (!baseUrl) {
    throw new DirectorNextBestActionApiError(
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
  contentType = false,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (contentType) headers["Content-Type"] = "application/json";

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

async function parseResponse(response: Response): Promise<unknown> {
  return response.json().catch(() => ({}));
}

function throwResponseError(response: Response, payload: unknown): never {
  const details = getErrorDetails(payload);
  throw new DirectorNextBestActionApiError(
    response.status,
    details.code ?? "DIRECTOR_NEXT_BEST_ACTION_UNAVAILABLE",
    details.message ?? `Lỗi HTTP ${response.status}: ${response.statusText}`,
  );
}

export async function getDirectorNextBestAction(
  params: DirectorNextBestActionParams = {},
  options: RequestOptions = {},
): Promise<DirectorNextBestActionResponse> {
  const searchParams = new URLSearchParams();
  if (params.admissionYear !== undefined)
    searchParams.set("admissionYear", String(params.admissionYear));
  if (params.scope) searchParams.set("scope", params.scope);
  if (params.queueFilter) searchParams.set("queueFilter", params.queueFilter);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.pageSize !== undefined)
    searchParams.set("pageSize", String(params.pageSize));
  if (params.outcomePeriod)
    searchParams.set("outcomePeriod", params.outcomePeriod);

  const baseUrl = resolveBaseUrl(options);
  const query = searchParams.toString();
  const url = `${baseUrl}/api/method/${SNAPSHOT_METHOD}${query ? `?${query}` : ""}`;
  const headers = await requestHeaders(options);

  let response: Response;
  try {
    response = await fetch(url, {
      headers,
      ...(typeof window !== "undefined"
        ? { credentials: "include" as RequestCredentials }
        : {}),
      cache: "no-store",
    });
  } catch {
    throw new DirectorNextBestActionApiError(
      503,
      "DIRECTOR_NEXT_BEST_ACTION_UNAVAILABLE",
      "Không thể kết nối tới danh sách việc cần xử lý.",
    );
  }

  const payload = await parseResponse(response);
  if (!response.ok) throwResponseError(response, payload);

  try {
    return normalizeDirectorNextBestAction(payload);
  } catch {
    throw new DirectorNextBestActionApiError(
      502,
      "INVALID_NEXT_BEST_ACTION_RESPONSE",
      "Phản hồi danh sách việc cần xử lý không hợp lệ.",
    );
  }
}

export async function applyActionCommand(
  command: ActionCommandRequest,
  options: RequestOptions = {},
): Promise<ActionCommandResponse> {
  const baseUrl = resolveBaseUrl(options);
  const url = `${baseUrl}/api/method/${COMMAND_METHOD}`;
  const headers = await requestHeaders(options, true);
  headers["Idempotency-Key"] = command.idempotencyKey;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(command),
      ...(typeof window !== "undefined"
        ? { credentials: "include" as RequestCredentials }
        : {}),
      cache: "no-store",
    });
  } catch {
    throw new DirectorNextBestActionApiError(
      503,
      "DIRECTOR_NEXT_BEST_ACTION_UNAVAILABLE",
      "Không thể cập nhật việc cần xử lý.",
    );
  }

  const payload = await parseResponse(response);
  if (!response.ok) throwResponseError(response, payload);

  try {
    return normalizeActionCommandResponse(payload);
  } catch {
    throw new DirectorNextBestActionApiError(
      502,
      "INVALID_ACTION_COMMAND_RESPONSE",
      "Phản hồi cập nhật việc cần xử lý không hợp lệ.",
    );
  }
}
