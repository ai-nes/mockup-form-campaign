import type {
  StudentWorklistActionsResponse,
  StudentWorklistItem,
} from "./types";

export type * from "./types";

const METHOD = "crm.api.student_worklist.list_actions_for_record";

type RequestOptions = { baseUrl?: string };

export class StudentWorklistApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "StudentWorklistApiError";
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
    throw new StudentWorklistApiError(
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

  return headers;
}

function unwrapMessage(value: unknown): Record<string, unknown> {
  const root = asRecord(value) ?? {};
  return asRecord(root.message) ?? root;
}

function textValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function normalizeStudentWorklistActions(
  value: unknown,
): StudentWorklistActionsResponse {
  const payload = unwrapMessage(value);
  if (!Array.isArray(payload.items)) {
    throw new Error("Invalid student worklist response");
  }

  const items: StudentWorklistItem[] = payload.items.flatMap((item, index) => {
    const action = asRecord(item);
    const objective = textValue(action?.objective);
    if (!objective) return [];

    return [
      {
        name: textValue(action?.name) ?? `student-action-${index}`,
        student: textValue(action?.student),
        actionType: textValue(action?.action_type),
        objective,
        state: textValue(action?.state) ?? "pending",
        executionStatus: textValue(action?.execution_status),
        priority: textValue(action?.priority) ?? "medium",
        dueAt: textValue(action?.due_at),
        actionOwner: textValue(action?.action_owner),
        origin: textValue(action?.origin),
        revision: numberValue(action?.revision, 1),
        isToday: action?.is_today === true,
        isOverdue: action?.is_overdue === true,
      },
    ];
  });

  return { items };
}

export async function getStudentWorklistActions(
  studentId: string,
  options: RequestOptions = {},
): Promise<StudentWorklistActionsResponse> {
  const normalizedStudentId = studentId.trim();
  if (!normalizedStudentId) {
    throw new StudentWorklistApiError(
      400,
      "INVALID_STUDENT_ID",
      "Thiếu mã học sinh để tải NBA.",
    );
  }

  const baseUrl = resolveBaseUrl(options);
  const query = new URLSearchParams({
    doctype: "CRM Lead",
    name: normalizedStudentId,
    page_size: "50",
  });
  const headers = await requestHeaders(options);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/method/${METHOD}?${query}`, {
      headers,
      ...(typeof window !== "undefined"
        ? { credentials: "include" as RequestCredentials }
        : {}),
      cache: "no-store",
    });
  } catch {
    throw new StudentWorklistApiError(
      503,
      "STUDENT_WORKLIST_UNAVAILABLE",
      "Không thể kết nối tới danh sách NBA của học sinh.",
    );
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = getErrorDetails(payload);
    throw new StudentWorklistApiError(
      response.status,
      details.code ?? "STUDENT_WORKLIST_UNAVAILABLE",
      details.message ?? `Lỗi HTTP ${response.status}: ${response.statusText}`,
    );
  }

  try {
    return normalizeStudentWorklistActions(payload);
  } catch {
    throw new StudentWorklistApiError(
      502,
      "INVALID_STUDENT_WORKLIST_RESPONSE",
      "Phản hồi danh sách NBA của học sinh không hợp lệ.",
    );
  }
}
