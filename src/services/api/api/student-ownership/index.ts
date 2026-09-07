const OWNERSHIP_TARGETS_METHOD = "crm.api.student_ownership.get_eligible_ownership_targets";
const CHANGE_OWNERSHIP_METHOD = "crm.api.student_ownership.change_student_ownership";

export interface AssignableSale {
  name: string;
  label: string;
  profile: string;
  role: string;
  function: string;
  team: string;
  campus: string;
}

export interface AssignableSalesResponse {
  studentId: string;
  sales: AssignableSale[];
}

export interface AssignStudentToSalesRequest {
  studentId: string;
  ownerId: string;
  reason: string;
  expectedRevision: number;
  idempotencyKey: string;
  correlationId: string;
  targetTeamId: string;
}

export type AssignStudentToSalesResponse = Record<string, unknown>;

export class StudentOwnershipApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "StudentOwnershipApiError";
  }
}

type StudentOwnershipRequestOptions = {
  baseUrl?: string;
  headers?: Record<string, string>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function unwrapMessage(value: unknown): unknown {
  const root = asRecord(value);
  return root?.message !== undefined ? root.message : value;
}

function resolveBaseUrl(options: StudentOwnershipRequestOptions): string {
  const baseUrl = (options.baseUrl ?? process.env.NEXT_PUBLIC_FRAPPE_URL ?? "").replace(/\/+$/, "");
  if (!baseUrl) {
    throw new StudentOwnershipApiError(
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
  options: StudentOwnershipRequestOptions,
  contentType = false,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers ?? {}),
  };
  if (contentType) headers["Content-Type"] = "application/json";

  if (!options.baseUrl && typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const cookieHeader = frappeCookieHeader((await cookies()).toString());
      if (cookieHeader) headers.Cookie = cookieHeader;
    } catch {
      // Service tests and non-request contexts do not have Next headers.
    }
  }

  if (typeof window !== "undefined" && contentType) {
    const csrfToken = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("csrf_token="))
      ?.split("=")
      .slice(1)
      .join("=");

    if (csrfToken) {
      headers["X-Frappe-CSRF-Token"] = decodeURIComponent(csrfToken);
    } else {
      try {
        const sessionResponse = await fetch(
          `${resolveBaseUrl(options)}/api/method/crm.api.session.me`,
          { credentials: "include", headers: { Accept: "application/json" } },
        );
        const payload = (await sessionResponse.json().catch(() => null)) as {
          message?: { csrf_token?: unknown };
        } | null;
        if (typeof payload?.message?.csrf_token === "string") {
          headers["X-Frappe-CSRF-Token"] = payload.message.csrf_token;
        }
      } catch {
        // The write request returns the authoritative CSRF error if needed.
      }
    }
  }

  return headers;
}

function errorDetails(value: unknown, status: number): { code: string; message: string } {
  const root = asRecord(value);
  const message = asRecord(root?.message);
  const error = asRecord(root?.error) ?? asRecord(message?.error);

  return {
    code:
      text(error?.code) ||
      text(message?.code) ||
      (status === 401 ? "UNAUTHENTICATED" : status === 403 ? "FORBIDDEN" : `HTTP_${status}`),
    message:
      text(error?.message) ||
      text(message?.message) ||
      text(root?.message) ||
      text(root?.exception) ||
      `Không thể gọi API phân công người phụ trách (${status}).`,
  };
}

async function request(
  url: string,
  init: RequestInit,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      ...(typeof window !== "undefined"
        ? { credentials: "include" as RequestCredentials }
        : {}),
      cache: "no-store",
    });
  } catch {
    throw new StudentOwnershipApiError(
      503,
      "STUDENT_OWNERSHIP_UNAVAILABLE",
      "Không thể kết nối tới dịch vụ phân công người phụ trách.",
    );
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = errorDetails(payload, response.status);
    throw new StudentOwnershipApiError(response.status, details.code, details.message);
  }

  return payload;
}

function normalizeAssignableSale(value: unknown, index: number): AssignableSale {
  const source = asRecord(value);
  const sale = {
    name: text(source?.name).trim(),
    label: text(source?.label).trim(),
    profile: text(source?.profile).trim(),
    role: text(source?.role).trim(),
    function: text(source?.function).trim(),
    team: text(source?.team).trim(),
    campus: text(source?.campus).trim(),
  };

  if (!sale.name || !sale.label) {
    throw new Error(`sales[${index}] thiếu name hoặc label`);
  }

  return sale;
}

function normalizeAssignableSales(studentId: string, value: unknown): AssignableSalesResponse {
  const source = asRecord(unwrapMessage(value));
  const sales = Array.isArray(source?.owners)
    ? source.owners.map((sale, index) => normalizeAssignableSale(sale, index))
    : null;

  if (!sales) {
    throw new Error("Phản hồi danh sách người phụ trách không hợp lệ");
  }

  return { studentId, sales };
}

export async function getAssignableSales(
  studentId: string,
  search = "",
  options: StudentOwnershipRequestOptions = {},
): Promise<AssignableSalesResponse> {
  const normalizedStudentId = studentId.trim();
  if (!normalizedStudentId) {
    throw new StudentOwnershipApiError(400, "INVALID_STUDENT_ID", "studentId là bắt buộc.");
  }

  const query = new URLSearchParams({ student: normalizedStudentId });
  const payload = await request(
    `${resolveBaseUrl(options)}/api/method/${OWNERSHIP_TARGETS_METHOD}?${query.toString()}`,
    { method: "GET", headers: await requestHeaders(options) },
  );

  try {
    const result = normalizeAssignableSales(normalizedStudentId, payload);
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return normalizedSearch
      ? {
          ...result,
          sales: result.sales.filter((sale) =>
            [sale.label, sale.team, sale.campus, sale.role, sale.profile]
              .join(" ")
              .toLocaleLowerCase()
              .includes(normalizedSearch),
          ),
        }
      : result;
  } catch {
    throw new StudentOwnershipApiError(
      502,
      "INVALID_ASSIGNABLE_SALES_RESPONSE",
      "Phản hồi danh sách Sale/CTV Sale không hợp lệ.",
    );
  }
}

export async function assignStudentToSales(
  requestBody: AssignStudentToSalesRequest,
  options: StudentOwnershipRequestOptions = {},
): Promise<AssignStudentToSalesResponse> {
  const studentId = requestBody.studentId.trim();
  const ownerId = requestBody.ownerId.trim();
  const reason = requestBody.reason.trim();
  const idempotencyKey = requestBody.idempotencyKey.trim();
  const correlationId = requestBody.correlationId.trim();
  const targetTeamId = requestBody.targetTeamId.trim();

  if (
    !studentId ||
    !ownerId ||
    !reason ||
    !idempotencyKey ||
    !correlationId ||
    !targetTeamId ||
    !Number.isInteger(requestBody.expectedRevision) ||
    requestBody.expectedRevision < 0
  ) {
    throw new StudentOwnershipApiError(
      400,
      "INVALID_PAYLOAD",
      "studentId, ownerId, targetTeamId, expectedRevision, reason, idempotencyKey và correlationId là bắt buộc.",
    );
  }

  const headers = await requestHeaders(options, true);
  headers["Idempotency-Key"] = idempotencyKey;

  const payload = await request(
    `${resolveBaseUrl(options)}/api/method/${CHANGE_OWNERSHIP_METHOD}`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        student: studentId,
        target_kind: "owner",
        target_id: ownerId,
        reason,
        expected_revision: requestBody.expectedRevision,
        idempotency_key: idempotencyKey,
        correlation_id: correlationId,
        target_team_id: targetTeamId,
      }),
    },
  );

  const result = asRecord(unwrapMessage(payload));
  if (!result) {
    throw new StudentOwnershipApiError(
      502,
      "INVALID_ASSIGN_STUDENT_RESPONSE",
      "Phản hồi cập nhật người phụ trách không hợp lệ.",
    );
  }

  return result;
}
