import type {
  SaleAttentionId,
  SaleAttentionItem,
  SaleConversionTrend,
  SaleConversionTrendPoint,
  SaleConversionTrendRange,
  SaleKpi,
  SaleOverviewMeta,
  SaleOverviewParams,
  SaleOverviewResponse,
  SaleOperations,
  SalePipelineStage,
  SaleStudentStatus,
  SaleStudentStatusItem,
  SaleTask,
  SaleTasks,
} from "./types";

export type * from "./types";

const METHOD = "crm.api.sale.get_sale_overview";
const KPI_IDS = [
  "assigned",
  "consulting",
  "qualified",
  "documents",
  "admission",
] as const;
const PIPELINE_IDS = [
  "assigned",
  "contacted",
  "consulted",
  "interested",
  "documents",
  "confirmed",
  "admitted",
] as const;
const ATTENTION_IDS = ["at-risk", "high-intent", "blocked"] as const;
const STATUS_IDS = ["new", "consulting", "waiting", "documents", "admission"] as const;
const OPERATION_IDS = ["overdue-tasks", "missing-documents"] as const;

export type RequestOptions = {
  baseUrl?: string;
  headers?: Record<string, string>;
};

export class SaleOverviewApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "SaleOverviewApiError";
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function number(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function count(value: unknown): number {
  return Math.max(0, Math.floor(number(value)));
}

function nullableText(value: unknown): string | null {
  return value === null || value === undefined || value === "" ? null : text(value);
}

function unwrapMessage(value: unknown): unknown {
  const root = asRecord(value);
  return root?.message !== undefined ? root.message : value;
}

function normalizeMeta(value: unknown): SaleOverviewMeta {
  const source = asRecord(value) ?? {};
  const viewer = asRecord(source.viewer) ?? {};
  const status = source.status;
  return {
    viewer: {
      id: text(viewer.id),
      displayName: text(viewer.displayName ?? viewer.display_name),
    },
    admissionYear: count(source.admissionYear ?? source.admission_year),
    date: text(source.date),
    asOf: text(source.asOf ?? source.as_of),
    timezone: text(source.timezone, "Asia/Ho_Chi_Minh"),
    status:
      status === "partial" || status === "unavailable" ? status : "available",
    warnings: Array.isArray(source.warnings)
      ? source.warnings.filter((item): item is string => typeof item === "string")
      : [],
  };
}

function normalizeKpi(value: unknown): SaleKpi {
  const source = asRecord(value) ?? {};
  const id = KPI_IDS.includes(source.id as (typeof KPI_IDS)[number])
    ? (source.id as SaleKpi["id"])
    : "assigned";
  return { id, value: count(source.value) };
}

function normalizeTask(value: unknown): SaleTask {
  const source = asRecord(value) ?? {};
  const type = source.type;
  const priority = source.priority;
  const status = source.status;
  return {
    id: text(source.id),
    studentId: text(source.studentId ?? source.student_id),
    studentName: text(source.studentName ?? source.student_name, "Hồ sơ chưa đặt tên"),
    title: text(source.title),
    type:
      type === "call" || type === "document" || type === "message" ? type : "other",
    startAt: nullableText(source.startAt ?? source.start_at),
    dueAt: nullableText(source.dueAt ?? source.due_at),
    context: nullableText(source.context),
    priority:
      priority === "High" || priority === "Low" ? priority : "Medium",
    status:
      status === "Backlog" ||
      status === "In Progress" ||
      status === "Done" ||
      status === "Canceled"
        ? status
        : "Todo",
    isOverdue: source.isOverdue === true || source.is_overdue === true,
  };
}

function normalizeTasks(value: unknown): SaleTasks {
  const source = asRecord(value) ?? {};
  const priority = asRecord(source.priority) ?? {};
  const summary = asRecord(source.summary) ?? {};
  const today = asRecord(summary.today) ?? {};
  const overdue = asRecord(summary.overdue) ?? {};
  const upcoming = asRecord(summary.upcoming) ?? {};
  return {
    priority: {
      overdueCount: count(priority.overdueCount ?? priority.overdue_count),
      items: Array.isArray(priority.items) ? priority.items.map(normalizeTask) : [],
    },
    summary: {
      today: {
        total: count(today.total),
        pending: count(today.pending),
        completed: count(today.completed),
      },
      overdue: { count: count(overdue.count) },
      upcoming: {
        count: count(upcoming.count),
        horizonDays: count(upcoming.horizonDays ?? upcoming.horizon_days) || 7,
      },
    },
  };
}

function normalizePipeline(value: unknown): { stages: SalePipelineStage[] } {
  const source = asRecord(value) ?? {};
  const stages = Array.isArray(source.stages) ? source.stages : [];
  return {
    stages: stages.map((item) => {
      const row = asRecord(item) ?? {};
      const id = PIPELINE_IDS.includes(row.id as (typeof PIPELINE_IDS)[number])
        ? (row.id as SalePipelineStage["id"])
        : "assigned";
      return { id, label: text(row.label), count: count(row.count) };
    }),
  };
}

function normalizeAttention(value: unknown): { items: SaleAttentionItem[] } {
  const source = asRecord(value) ?? {};
  return {
    items: Array.isArray(source.items)
      ? source.items.map((item) => {
          const row = asRecord(item) ?? {};
          const id = ATTENTION_IDS.includes(row.id as SaleAttentionId)
            ? (row.id as SaleAttentionId)
            : "blocked";
          return { id, count: count(row.count) };
        })
      : [],
  };
}

function normalizeTrendPoint(value: unknown): SaleConversionTrendPoint {
  const source = asRecord(value) ?? {};
  return {
    label: text(source.label),
    periodStart: text(source.periodStart ?? source.period_start),
    periodEnd: text(source.periodEnd ?? source.period_end),
    consulted: count(source.consulted),
    admitted: count(source.admitted),
  };
}

function normalizeTrendRange(value: unknown): SaleConversionTrendRange {
  const source = asRecord(value) ?? {};
  return {
    from: text(source.from),
    to: text(source.to),
    points: Array.isArray(source.points) ? source.points.map(normalizeTrendPoint) : [],
  };
}

function normalizeTrend(value: unknown): SaleConversionTrend {
  const source = asRecord(value) ?? {};
  const ranges = asRecord(source.ranges) ?? {};
  return {
    defaultRange: source.defaultRange === "12w" ? "12w" : "4w",
    ranges: {
      "4w": normalizeTrendRange(ranges["4w"]),
      "12w": normalizeTrendRange(ranges["12w"]),
    },
  };
}

function normalizeStudentStatus(value: unknown): SaleStudentStatus {
  const source = asRecord(value) ?? {};
  return {
    total: count(source.total),
    items: Array.isArray(source.items)
      ? source.items.map((item): SaleStudentStatusItem => {
          const row = asRecord(item) ?? {};
          const id = STATUS_IDS.includes(row.id as (typeof STATUS_IDS)[number])
            ? (row.id as SaleStudentStatusItem["id"])
            : "new";
          const share = row.share;
          return {
            id,
            label: text(row.label),
            count: count(row.count),
            share:
              share === null || share === undefined
                ? null
                : number(share, 0),
          };
        })
      : [],
  };
}

function normalizeOperations(value: unknown): SaleOperations {
  const source = asRecord(value) ?? {};
  return {
    total: count(source.total),
    items: Array.isArray(source.items)
      ? source.items.map((item) => {
          const row = asRecord(item) ?? {};
          const id = OPERATION_IDS.includes(row.id as (typeof OPERATION_IDS)[number])
            ? (row.id as SaleOperations["items"][number]["id"])
            : "overdue-tasks";
          return { id, count: count(row.count) };
        })
      : [],
  };
}

export function normalizeSaleOverview(value: unknown): SaleOverviewResponse {
  const payload = asRecord(unwrapMessage(value));
  const meta = asRecord(payload?.meta);
  const tasks = asRecord(payload?.tasks);
  const priority = asRecord(tasks?.priority);
  const summary = asRecord(tasks?.summary);
  const pipeline = asRecord(payload?.pipeline);
  const attention = asRecord(payload?.attention);
  const conversionTrend = asRecord(payload?.conversionTrend ?? payload?.conversion_trend);
  const trendRanges = asRecord(conversionTrend?.ranges);
  const studentStatus = asRecord(payload?.studentStatus ?? payload?.student_status);
  const operations = asRecord(payload?.operations);

  if (
    !payload ||
    !meta ||
    !Array.isArray(payload.kpis) ||
    !tasks ||
    !priority ||
    !summary ||
    !Array.isArray(priority.items) ||
    !pipeline ||
    !Array.isArray(pipeline.stages) ||
    !attention ||
    !Array.isArray(attention.items) ||
    !conversionTrend ||
    !trendRanges ||
    !asRecord(trendRanges["4w"]) ||
    !asRecord(trendRanges["12w"]) ||
    !studentStatus ||
    !Array.isArray(studentStatus.items) ||
    !operations ||
    !Array.isArray(operations.items)
  ) {
    throw new Error("Invalid Sale overview response");
  }

  const result: SaleOverviewResponse = {
    meta: normalizeMeta(meta),
    kpis: payload.kpis.map(normalizeKpi),
    tasks: normalizeTasks(tasks),
    pipeline: normalizePipeline(pipeline),
    attention: normalizeAttention(attention),
    conversionTrend: normalizeTrend(conversionTrend),
    studentStatus: normalizeStudentStatus(studentStatus),
    operations: normalizeOperations(operations),
  };

  const kpiIds = new Set(result.kpis.map((item) => item.id));
  const stageIds = new Set(result.pipeline.stages.map((item) => item.id));
  if (
    result.kpis.length !== KPI_IDS.length ||
    !KPI_IDS.every((id) => kpiIds.has(id)) ||
    result.pipeline.stages.length !== PIPELINE_IDS.length ||
    !PIPELINE_IDS.every((id) => stageIds.has(id))
  ) {
    throw new Error("Incomplete Sale overview response");
  }
  return result;
}

function resolveBaseUrl(options: RequestOptions): string {
  const baseUrl = (
    options.baseUrl ?? process.env.NEXT_PUBLIC_FRAPPE_URL ?? ""
  ).replace(/\/+$/, "");
  if (!baseUrl) {
    throw new SaleOverviewApiError(
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
      // Contract tests and non-request contexts do not have Next headers.
    }
  }
  return headers;
}

function errorDetails(
  payload: unknown,
  status: number,
): { code: string; message: string } {
  const root = asRecord(payload);
  const message = asRecord(root?.message);
  const error = asRecord(root?.error) ?? asRecord(message?.error);
  return {
    code:
      text(error?.code) ||
      (status === 401
        ? "UNAUTHENTICATED"
        : status === 403
          ? "FORBIDDEN"
          : `HTTP_${status}`),
    message:
      text(error?.message) ||
      text(message?.message) ||
      text(root?.message) ||
      text(root?.exception) ||
      `Không thể tải tổng quan Sale (${status}).`,
  };
}

export async function getSaleOverview(
  params: SaleOverviewParams = {},
  options: RequestOptions = {},
): Promise<SaleOverviewResponse> {
  const url = new URL(`${resolveBaseUrl(options)}/api/method/${METHOD}`);
  if (params.admissionYear) {
    url.searchParams.set("admissionYear", String(params.admissionYear));
  }
  if (params.date) url.searchParams.set("date", params.date);
  url.searchParams.set("trendRange", params.trendRange ?? "4w");
  if (params.timezone) url.searchParams.set("timezone", params.timezone);
  url.searchParams.set("priorityLimit", String(params.priorityLimit ?? 4));

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
    throw new SaleOverviewApiError(
      503,
      "SALE_OVERVIEW_UNAVAILABLE",
      "Không thể kết nối đến máy chủ tổng quan Sale.",
    );
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = errorDetails(payload, response.status);
    throw new SaleOverviewApiError(response.status, error.code, error.message);
  }

  try {
    return normalizeSaleOverview(payload);
  } catch {
    throw new SaleOverviewApiError(
      502,
      "INVALID_SALE_OVERVIEW_RESPONSE",
      "Phản hồi tổng quan Sale không hợp lệ.",
    );
  }
}
