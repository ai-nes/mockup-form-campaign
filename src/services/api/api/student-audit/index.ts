import type {
  StudentAuditLog,
  StudentAuditLogsParams,
  StudentAuditLogsResponse,
} from "./types";

export type * from "./types";

const METHOD = "crm.api.audit.get_student_audit_logs";

export type RequestOptions = {
  baseUrl?: string;
  headers?: Record<string, string>;
};

export class StudentAuditApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "StudentAuditApiError";
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function resolveBaseUrl(options: RequestOptions = {}): string {
  const baseUrl = (
    options.baseUrl ??
    process.env.NEXT_PUBLIC_FRAPPE_URL ??
    ""
  ).replace(/\/+$/, "");

  if (!baseUrl) {
    throw new StudentAuditApiError(
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
  options: RequestOptions = {},
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  if (!options.baseUrl && typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const cookieHeader = frappeCookieHeader((await cookies()).toString());
      if (cookieHeader) headers.Cookie = cookieHeader;
    } catch {
      // Contract tests or non-request contexts.
    }
  }

  return headers;
}

function optionalString(value: unknown): string | null {
  return value === null || value === undefined || value === ""
    ? null
    : String(value);
}

function normalizeAuditLog(raw: unknown): StudentAuditLog {
  const source = asRecord(raw) || {};
  const sourceName = String(source.source_name ?? source.sourceName ?? "");
  const occurredAt = String(source.occurred_at ?? source.occurredAt ?? "");
  const eventId = String(
    source.event_id ??
      source.eventId ??
      `${sourceName}:${occurredAt}:${source.action ?? "unknown"}`,
  );

  return {
    eventId,
    action: (source.action === "created" ||
    source.action === "updated" ||
    source.action === "deleted"
      ? source.action
      : "updated") as StudentAuditLog["action"],
    changeType:
      source.change_type === "added" ||
      source.change_type === "changed" ||
      source.change_type === "removed"
        ? source.change_type
        : null,
    doctype: String(source.doctype ?? "CRM Lead"),
    docname: String(source.docname ?? ""),
    fieldname: optionalString(source.fieldname),
    fieldLabel: optionalString(source.field_label ?? source.fieldLabel),
    oldValue: source.old_value ?? source.oldValue ?? null,
    newValue: source.new_value ?? source.newValue ?? null,
    owner: optionalString(source.owner),
    ownerFullName: optionalString(
      source.owner_full_name ?? source.ownerFullName,
    ),
    occurredAt,
    source: String(source.source ?? ""),
    sourceName,
    restored:
      typeof source.restored === "boolean" ? source.restored : undefined,
  };
}

function unwrapMessage(payload: unknown): unknown {
  const root = asRecord(payload);
  return root?.message !== undefined ? root.message : payload;
}

function resolveError(
  payload: unknown,
  status: number,
): { code: string; message: string } {
  const root = asRecord(payload);
  const messageObject = asRecord(root?.message);
  const errorObject = asRecord(root?.error) ?? asRecord(messageObject?.error);
  const statusCode =
    status === 403
      ? "FORBIDDEN"
      : status === 404
        ? "STUDENT_NOT_FOUND"
        : status === 417
          ? "INVALID_PAGINATION"
          : undefined;

  const code =
    (typeof errorObject?.code === "string" && errorObject.code) ||
    statusCode ||
    (typeof root?.exception === "string" && root.exception) ||
    `HTTP_${status}`;

  const message =
    (typeof errorObject?.message === "string" && errorObject.message) ||
    (typeof messageObject?.message === "string" && messageObject.message) ||
    (typeof root?.message === "string" && root.message) ||
    (typeof root?.exception === "string" && root.exception) ||
    `Không thể tải nhật ký học sinh (${status}).`;

  return { code, message };
}

function isAuditLogsResponse(value: unknown): value is {
  student: string;
  logs: unknown[];
  total: number;
  start: number;
  page_length: number;
  read_only: boolean;
} {
  const source = asRecord(value);
  return Boolean(
    source &&
    typeof source.student === "string" &&
    Array.isArray(source.logs) &&
    typeof source.total === "number" &&
    typeof source.start === "number" &&
    typeof source.page_length === "number" &&
    typeof source.read_only === "boolean",
  );
}

export async function getStudentAuditLogs(
  params: StudentAuditLogsParams,
  options: RequestOptions = {},
): Promise<StudentAuditLogsResponse> {
  const student = params.student.trim();
  if (!student) {
    throw new StudentAuditApiError(
      417,
      "INVALID_STUDENT",
      "Cần cung cấp mã học sinh để tải nhật ký.",
    );
  }

  const url = new URL(`${resolveBaseUrl(options)}/api/method/${METHOD}`);
  url.searchParams.set("student", student);
  url.searchParams.set("start", String(params.start ?? 0));
  url.searchParams.set("page_length", String(params.pageLength ?? 100));

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: "GET",
      headers: await requestHeaders(options),
      ...(typeof window !== "undefined"
        ? { credentials: "include" as RequestCredentials }
        : {}),
      cache: "no-store",
    });
  } catch {
    throw new StudentAuditApiError(
      503,
      "AUDIT_API_UNAVAILABLE",
      "Không thể kết nối đến máy chủ nhật ký học sinh.",
    );
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = resolveError(payload, response.status);
    throw new StudentAuditApiError(response.status, error.code, error.message);
  }

  const data = unwrapMessage(payload);
  if (!isAuditLogsResponse(data)) {
    throw new StudentAuditApiError(
      502,
      "INVALID_AUDIT_RESPONSE",
      "Phản hồi nhật ký học sinh không hợp lệ.",
    );
  }

  return {
    student: data.student,
    logs: data.logs.map(normalizeAuditLog),
    total: data.total,
    start: data.start,
    pageLength: data.page_length,
    readOnly: data.read_only,
  };
}
