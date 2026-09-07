import type {
  CreateNotePayload,
  CRMNote,
  ListNotesParams,
  ListNotesResponse,
  UpdateNotePayload,
} from "./types";

export type * from "./types";

const METHODS = {
  LIST_NOTES: "crm.api.note.list_notes",
  GET_NOTE: "crm.api.note.get_note",
  CREATE_NOTE: "crm.api.note.create_note",
  UPDATE_NOTE: "crm.api.note.update_note",
  DELETE_NOTE: "crm.api.note.delete_note",
} as const;

export type RequestOptions = {
  baseUrl?: string;
  headers?: Record<string, string>;
};

export class CrmNoteApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "CrmNoteApiError";
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
    throw new CrmNoteApiError(
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
  isWrite = false,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (!options.baseUrl && typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const cookieHeader = frappeCookieHeader((await cookies()).toString());
      if (cookieHeader) headers.Cookie = cookieHeader;
    } catch {
      // Contract tests or non-request contexts
    }
  }

  if (typeof window !== "undefined" && isWrite) {
    const cookieToken = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("csrf_token="))
      ?.split("=")
      .slice(1)
      .join("=");

    if (cookieToken) {
      headers["X-Frappe-CSRF-Token"] = decodeURIComponent(cookieToken);
    } else {
      try {
        const sessionRes = await fetch(
          `${resolveBaseUrl(options)}/api/method/crm.api.session.me`,
          { credentials: "include", headers: { Accept: "application/json" } },
        );
        const sessionPayload = (await sessionRes.json().catch(() => null)) as {
          message?: { csrf_token?: unknown };
        } | null;
        const csrfToken = sessionPayload?.message?.csrf_token;
        if (typeof csrfToken === "string" && csrfToken) {
          headers["X-Frappe-CSRF-Token"] = csrfToken;
        }
      } catch {
        // Fallback to cookie-only
      }
    }
  }

  return headers;
}

function normalizeCRMNote(raw: unknown): CRMNote {
  const obj = asRecord(raw) || {};
  return {
    name: String(obj.name || ""),
    content: String(obj.content || ""),
    referenceDoctype: (obj.reference_doctype ||
      obj.referenceDoctype ||
      "CRM Lead") as CRMNote["referenceDoctype"],
    referenceDocname: String(
      obj.reference_docname || obj.referenceDocname || "",
    ),
    modified: obj.modified ? String(obj.modified) : undefined,
    creation: obj.creation ? String(obj.creation) : undefined,
    owner: obj.owner ? String(obj.owner) : undefined,
    ownerFullName:
      obj.owner_full_name || obj.ownerFullName
        ? String(obj.owner_full_name || obj.ownerFullName)
        : undefined,
    modifiedBy:
      obj.modified_by || obj.modifiedBy
        ? String(obj.modified_by || obj.modifiedBy)
        : undefined,
  };
}

async function callFrappeRpc<T>(
  method: string,
  body: Record<string, unknown>,
  options: RequestOptions = {},
  isWrite = false,
): Promise<T> {
  const baseUrl = resolveBaseUrl(options);
  const endpoint = `${baseUrl}/api/method/${method}`;
  const url = isWrite
    ? endpoint
    : `${endpoint}?${new URLSearchParams(
        Object.entries(body).map(([key, value]) => [key, String(value)]),
      )}`;
  const headers = await requestHeaders(options, isWrite);

  let res: Response;
  try {
    res = await fetch(url, {
      method: isWrite ? "POST" : "GET",
      headers,
      ...(isWrite ? { body: JSON.stringify(body) } : {}),
      ...(typeof window !== "undefined"
        ? { credentials: "include" as RequestCredentials }
        : {}),
      cache: "no-store",
    });
  } catch {
    throw new CrmNoteApiError(
      503,
      "NOTE_API_UNAVAILABLE",
      "Không thể kết nối đến máy chủ quản lý ghi chú.",
    );
  }

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    const root = asRecord(payload);
    const messageObj = asRecord(root?.message);
    const errorObj = asRecord(root?.error) ?? asRecord(messageObj?.error);

    const code =
      (typeof errorObj?.code === "string" && errorObj.code) ||
      (typeof root?.exception === "string" && root.exception) ||
      `HTTP_${res.status}`;

    const message =
      (typeof errorObj?.message === "string" && errorObj.message) ||
      (typeof messageObj?.message === "string" && messageObj.message) ||
      (typeof root?.message === "string" && root.message) ||
      `Thao tác ghi chú thất bại (${res.status}).`;

    throw new CrmNoteApiError(res.status, code, message);
  }

  // Frappe RPC wraps responses in a `message` key
  const root = asRecord(payload);
  const messageData = root?.message !== undefined ? root.message : payload;
  return messageData as T;
}

/**
 * Lấy danh sách ghi chú của CRM Student hoặc CRM Student
 */
export async function listNotes(
  params: ListNotesParams,
  options: RequestOptions = {},
): Promise<ListNotesResponse> {
  const body: Record<string, unknown> = {
    reference_doctype: params.referenceDoctype,
    reference_docname: params.referenceDocname,
    start: params.start ?? 0,
    page_length: params.pageLength ?? 20,
  };
  if (params.search) {
    body.search = params.search;
  }

  const raw = await callFrappeRpc<{
    total?: number;
    start?: number;
    page_length?: number;
    notes?: unknown[];
  }>(METHODS.LIST_NOTES, body, options, false);

  const rawNotes = Array.isArray(raw?.notes) ? raw.notes : [];
  return {
    total: typeof raw?.total === "number" ? raw.total : rawNotes.length,
    start: typeof raw?.start === "number" ? raw.start : (params.start ?? 0),
    pageLength:
      typeof raw?.page_length === "number"
        ? raw.page_length
        : (params.pageLength ?? 20),
    notes: rawNotes.map(normalizeCRMNote),
  };
}

/**
 * Lấy chi tiết một ghi chú theo ID/name
 */
export async function getNote(
  name: string,
  options: RequestOptions = {},
): Promise<CRMNote> {
  const raw = await callFrappeRpc<unknown>(
    METHODS.GET_NOTE,
    { name },
    options,
    false,
  );
  return normalizeCRMNote(raw);
}

/**
 * Tạo mới ghi chú cho Student hoặc Contact
 */
export async function createNote(
  payload: CreateNotePayload,
  options: RequestOptions = {},
): Promise<CRMNote> {
  const body: Record<string, unknown> = {
    reference_doctype: payload.referenceDoctype,
    reference_docname: payload.referenceDocname,
  };
  if (payload.content !== undefined) {
    body.content = payload.content;
  }

  const raw = await callFrappeRpc<unknown>(
    METHODS.CREATE_NOTE,
    body,
    options,
    true,
  );
  return normalizeCRMNote(raw);
}

/**
 * Cập nhật nội dung ghi chú
 */
export async function updateNote(
  payload: UpdateNotePayload,
  options: RequestOptions = {},
): Promise<CRMNote> {
  const body: Record<string, unknown> = {
    name: payload.name,
  };
  if (payload.content !== undefined) {
    body.content = payload.content;
  }

  const raw = await callFrappeRpc<unknown>(
    METHODS.UPDATE_NOTE,
    body,
    options,
    true,
  );
  return normalizeCRMNote(raw);
}

/**
 * Xóa ghi chú
 */
export async function deleteNote(
  name: string,
  options: RequestOptions = {},
): Promise<{ success: boolean }> {
  await callFrappeRpc<unknown>(METHODS.DELETE_NOTE, { name }, options, true);
  return { success: true };
}
