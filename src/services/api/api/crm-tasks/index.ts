import type {
  CRMTask,
  CRMTaskPriority,
  CRMTaskStatus,
  CreateTaskPayload,
  DeleteTaskResponse,
  ListTasksParams,
  ListTasksResponse,
  UpdateTaskPayload,
} from "./types";

export type * from "./types";

const METHODS = {
  LIST_TASKS: "crm.api.task.list_tasks",
  GET_TASK: "crm.api.task.get_task",
  CREATE_TASK: "crm.api.task.create_task",
  UPDATE_TASK: "crm.api.task.update_task",
  DELETE_TASK: "crm.api.task.delete_task",
} as const;

export type RequestOptions = {
  baseUrl?: string;
  headers?: Record<string, string>;
};

export class CrmTaskApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "CrmTaskApiError";
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
    throw new CrmTaskApiError(
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
    ...(isWrite ? { "Content-Type": "application/json" } : {}),
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
        // Fallback to cookie-only.
      }
    }
  }

  return headers;
}

function normalizePriority(value: unknown): CRMTaskPriority | undefined {
  return value === "Low" || value === "Medium" || value === "High"
    ? value
    : undefined;
}

function normalizeStatus(value: unknown): CRMTaskStatus | undefined {
  return value === "Backlog" ||
    value === "Todo" ||
    value === "In Progress" ||
    value === "Done" ||
    value === "Canceled"
    ? value
    : undefined;
}

function optionalString(value: unknown): string | undefined {
  return value === null || value === undefined || value === ""
    ? undefined
    : String(value);
}

function normalizeCRMTask(raw: unknown): CRMTask {
  const obj = asRecord(raw) || {};
  return {
    name: String(obj.name || ""),
    title: String(obj.title || ""),
    description: optionalString(obj.description),
    actionCode: optionalString(obj.action_code ?? obj.actionCode),
    student: optionalString(obj.student),
    linkedInteraction: optionalString(
      obj.linked_interaction ?? obj.linkedInteraction,
    ),
    priority: normalizePriority(obj.priority),
    startDate: optionalString(obj.start_date ?? obj.startDate),
    assignedTo: optionalString(obj.assigned_to ?? obj.assignedTo),
    status: normalizeStatus(obj.status),
    dueDate: optionalString(obj.due_date ?? obj.dueDate),
    referenceDoctype: (obj.reference_doctype ||
      obj.referenceDoctype ||
      "CRM Lead") as CRMTask["referenceDoctype"],
    referenceDocname: String(
      obj.reference_docname || obj.referenceDocname || "",
    ),
    owner: optionalString(obj.owner),
    creation: optionalString(obj.creation),
    modified: optionalString(obj.modified),
  };
}

async function callTaskApi<T>(
  method: string,
  requestMethod: "GET" | "POST" | "PUT" | "DELETE",
  options: RequestOptions = {},
  query: Record<string, string | number | undefined> = {},
  body?: Record<string, unknown>,
): Promise<T> {
  const baseUrl = resolveBaseUrl(options);
  const url = new URL(`${baseUrl}/api/method/${method}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value));
  });

  const isWrite = requestMethod !== "GET";
  const headers = await requestHeaders(options, isWrite);
  const requestInit: RequestInit = {
    method: requestMethod,
    headers,
    ...(typeof window !== "undefined"
      ? { credentials: "include" as RequestCredentials }
      : {}),
    cache: "no-store",
  };

  if (body !== undefined) requestInit.body = JSON.stringify(body);

  let response: Response;
  try {
    response = await fetch(url.toString(), requestInit);
  } catch {
    throw new CrmTaskApiError(
      503,
      "TASK_API_UNAVAILABLE",
      "Không thể kết nối đến máy chủ quản lý task.",
    );
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const root = asRecord(payload);
    const messageObj = asRecord(root?.message);
    const errorObj = asRecord(root?.error) ?? asRecord(messageObj?.error);
    const code =
      (typeof errorObj?.code === "string" && errorObj.code) ||
      (typeof root?.exception === "string" && root.exception) ||
      `HTTP_${response.status}`;
    const message =
      (typeof errorObj?.message === "string" && errorObj.message) ||
      (typeof messageObj?.message === "string" && messageObj.message) ||
      (typeof root?.message === "string" && root.message) ||
      `Thao tác task thất bại (${response.status}).`;

    throw new CrmTaskApiError(response.status, code, message);
  }

  const root = asRecord(payload);
  const messageData = root?.message !== undefined ? root.message : payload;
  return messageData as T;
}

function toCreateBody(payload: CreateTaskPayload): Record<string, unknown> {
  return {
    reference_doctype: payload.referenceDoctype,
    reference_docname: payload.referenceDocname,
    title: payload.title,
    ...(payload.description !== undefined
      ? { description: payload.description }
      : {}),
    ...(payload.actionCode !== undefined
      ? { action_code: payload.actionCode }
      : {}),
    ...(payload.priority !== undefined ? { priority: payload.priority } : {}),
    ...(payload.startDate !== undefined
      ? { start_date: payload.startDate }
      : {}),
    ...(payload.assignedTo !== undefined
      ? { assigned_to: payload.assignedTo }
      : {}),
    ...(payload.status !== undefined ? { status: payload.status } : {}),
    ...(payload.dueDate !== undefined ? { due_date: payload.dueDate } : {}),
    ...(payload.linkedInteraction !== undefined
      ? { linked_interaction: payload.linkedInteraction }
      : {}),
  };
}

function toUpdateBody(payload: UpdateTaskPayload): Record<string, unknown> {
  return {
    name: payload.name,
    ...(payload.title !== undefined ? { title: payload.title } : {}),
    ...(payload.description !== undefined
      ? { description: payload.description }
      : {}),
    ...(payload.priority !== undefined ? { priority: payload.priority } : {}),
    ...(payload.startDate !== undefined
      ? { start_date: payload.startDate }
      : {}),
    ...(payload.assignedTo !== undefined
      ? { assigned_to: payload.assignedTo }
      : {}),
    ...(payload.status !== undefined ? { status: payload.status } : {}),
    ...(payload.dueDate !== undefined ? { due_date: payload.dueDate } : {}),
    ...(payload.linkedInteraction !== undefined
      ? { linked_interaction: payload.linkedInteraction }
      : {}),
  };
}

export async function listTasks(
  params: ListTasksParams,
  options: RequestOptions = {},
): Promise<ListTasksResponse> {
  const raw = await callTaskApi<{
    total?: number;
    start?: number;
    page_length?: number;
    tasks?: unknown[];
  }>(METHODS.LIST_TASKS, "GET", options, {
    reference_doctype: params.referenceDoctype,
    reference_docname: params.referenceDocname,
    search: params.search,
    status: params.status,
    start: params.start ?? 0,
    page_length: params.pageLength ?? 20,
  });

  const rawTasks = Array.isArray(raw?.tasks) ? raw.tasks : [];
  return {
    total: typeof raw?.total === "number" ? raw.total : rawTasks.length,
    start: typeof raw?.start === "number" ? raw.start : (params.start ?? 0),
    pageLength:
      typeof raw?.page_length === "number"
        ? raw.page_length
        : (params.pageLength ?? 20),
    tasks: rawTasks.map(normalizeCRMTask),
  };
}

export async function getTask(
  name: string,
  options: RequestOptions = {},
): Promise<CRMTask> {
  const raw = await callTaskApi<unknown>(METHODS.GET_TASK, "GET", options, {
    name,
  });
  return normalizeCRMTask(raw);
}

export async function createTask(
  payload: CreateTaskPayload,
  options: RequestOptions = {},
): Promise<CRMTask> {
  const raw = await callTaskApi<unknown>(
    METHODS.CREATE_TASK,
    "POST",
    options,
    {},
    toCreateBody(payload),
  );
  return normalizeCRMTask(raw);
}

export async function updateTask(
  payload: UpdateTaskPayload,
  options: RequestOptions = {},
): Promise<CRMTask> {
  const raw = await callTaskApi<unknown>(
    METHODS.UPDATE_TASK,
    "PUT",
    options,
    {},
    toUpdateBody(payload),
  );
  return normalizeCRMTask(raw);
}

export async function deleteTask(
  name: string,
  options: RequestOptions = {},
): Promise<DeleteTaskResponse> {
  const raw = await callTaskApi<{ deleted?: unknown }>(
    METHODS.DELETE_TASK,
    "DELETE",
    options,
    { name },
  );
  return { deleted: String(raw?.deleted ?? name) };
}
