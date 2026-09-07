import type {
  CtvSaleContactOutcomeItem,
  CtvSaleContactOutcomes,
  CtvSaleContactTrend,
  CtvSaleContactTrendPoint,
  CtvSaleContactTrendRange,
  CtvSaleKpi,
  CtvSaleOverviewMeta,
  CtvSaleOverviewParams,
  CtvSaleOverviewResponse,
  CtvSalePriorityTask,
  CtvSaleStudentStatus,
  CtvSaleStudentStatusItem,
  CtvSaleTasks,
} from "./types";

export type * from "./types";

const METHOD = "crm.api.ctv_sale.get_ctv_sale_overview";
const KPI_IDS = ["assigned", "uncontacted", "follow-up", "transfer"] as const;

export type RequestOptions = {
  baseUrl?: string;
  headers?: Record<string, string>;
};

export class CtvSaleOverviewApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "CtvSaleOverviewApiError";
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

function nullableNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : number(value, 0);
}

function asRange(value: unknown, fallback: "7d" | "30d" = "7d"): "7d" | "30d" {
  return value === "7d" || value === "30d" ? value : fallback;
}

function unwrapMessage(value: unknown): unknown {
  const root = asRecord(value);
  return root?.message !== undefined ? root.message : value;
}

function normalizeMeta(value: unknown): CtvSaleOverviewMeta {
  const source = asRecord(value) ?? {};
  const viewer = asRecord(source.viewer) ?? {};
  const status = source.status;
  return {
    viewer: {
      id: text(viewer.id),
      displayName: text(viewer.displayName ?? viewer.display_name),
    },
    date: text(source.date),
    asOf: text(source.asOf ?? source.as_of),
    timezone: text(source.timezone, "Asia/Ho_Chi_Minh"),
    status:
      status === "partial" || status === "unavailable" ? status : "available",
    warnings: Array.isArray(source.warnings)
      ? source.warnings.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
  };
}

function normalizeKpi(value: unknown): CtvSaleKpi {
  const source = asRecord(value) ?? {};
  const id = source.id;
  const tone = source.tone;
  return {
    id:
      id === "uncontacted" || id === "follow-up" || id === "transfer"
        ? id
        : "assigned",
    value: Math.max(0, Math.floor(number(source.value))),
    deltaValue: nullableNumber(source.deltaValue ?? source.delta_value),
    deltaUnit: source.deltaUnit === "percent" ? "percent" : "count",
    comparisonPeriod:
      source.comparisonPeriod === "previous-day" ||
      source.comparisonPeriod === "previous-week" ||
      source.comparisonPeriod === "current-week"
        ? source.comparisonPeriod
        : null,
    direction:
      source.direction === "up" ||
      source.direction === "down" ||
      source.direction === "flat"
        ? source.direction
        : null,
    ratioOfAssigned: nullableNumber(
      source.ratioOfAssigned ?? source.ratio_of_assigned,
    ),
    tone:
      tone === "info" || tone === "warning" || tone === "success"
        ? tone
        : "primary",
  };
}

function normalizePriorityTask(value: unknown): CtvSalePriorityTask {
  const source = asRecord(value) ?? {};
  const taskType = source.taskType ?? source.task_type;
  const priority = source.priority;
  const status = source.status;
  return {
    id: text(source.id),
    studentId: text(source.studentId ?? source.student_id),
    studentName: text(source.studentName ?? source.student_name),
    taskType:
      taskType === "call" || taskType === "follow-up" || taskType === "message"
        ? taskType
        : "other",
    taskTypeLabel: text(
      source.taskTypeLabel ?? source.task_type_label,
      "Việc khác",
    ),
    dueAt:
      source.dueAt === null || source.dueAt === undefined
        ? null
        : text(source.dueAt ?? source.due_at),
    detail: text(source.detail),
    priority: priority === "high" || priority === "low" ? priority : "medium",
    status:
      status === "in-progress" || status === "done" || status === "canceled"
        ? status
        : "todo",
    isOverdue: source.isOverdue === true || source.is_overdue === true,
  };
}

function normalizeTasks(value: unknown): CtvSaleTasks {
  const source = asRecord(value) ?? {};
  const priority = asRecord(source.priority) ?? {};
  const summary = asRecord(source.summary) ?? {};
  const today = asRecord(summary.today) ?? {};
  const overdue = asRecord(summary.overdue) ?? {};
  const upcoming = asRecord(summary.upcoming) ?? {};
  const completion = asRecord(summary.completion) ?? {};
  return {
    priority: {
      overdueCount: Math.max(
        0,
        Math.floor(number(priority.overdueCount ?? priority.overdue_count)),
      ),
      items: Array.isArray(priority.items)
        ? priority.items.map(normalizePriorityTask)
        : [],
    },
    summary: {
      today: {
        total: Math.max(0, Math.floor(number(today.total))),
        pending: Math.max(0, Math.floor(number(today.pending))),
        completed: Math.max(0, Math.floor(number(today.completed))),
      },
      overdue: { count: Math.max(0, Math.floor(number(overdue.count))) },
      upcoming: {
        count: Math.max(0, Math.floor(number(upcoming.count))),
        horizonDays: Math.max(
          0,
          Math.floor(number(upcoming.horizonDays ?? upcoming.horizon_days, 7)),
        ),
      },
      completion: {
        completed: Math.max(0, Math.floor(number(completion.completed))),
        total: Math.max(0, Math.floor(number(completion.total))),
        rate: nullableNumber(completion.rate),
      },
    },
  };
}

function normalizeStudentStatus(value: unknown): CtvSaleStudentStatus {
  const source = asRecord(value) ?? {};
  const items = Array.isArray(source.items) ? source.items : [];
  return {
    total: Math.max(0, Math.floor(number(source.total))),
    items: items.map((item): CtvSaleStudentStatusItem => {
      const row = asRecord(item) ?? {};
      const id = row.id;
      return {
        id:
          id === "consulting" || id === "connected" || id === "transferred"
            ? id
            : "new",
        label: text(row.label),
        count: Math.max(0, Math.floor(number(row.count))),
        share: nullableNumber(row.share),
      };
    }),
  };
}

function normalizeTrendPoint(value: unknown): CtvSaleContactTrendPoint {
  const source = asRecord(value) ?? {};
  return {
    label: text(source.label),
    periodStart: text(source.periodStart ?? source.period_start),
    periodEnd: text(source.periodEnd ?? source.period_end),
    contacts: Math.max(0, Math.floor(number(source.contacts))),
    connected: Math.max(0, Math.floor(number(source.connected))),
  };
}

function normalizeTrendRange(value: unknown): CtvSaleContactTrendRange {
  const source = asRecord(value) ?? {};
  const totals = asRecord(source.totals) ?? {};
  return {
    from: text(source.from),
    to: text(source.to),
    points: Array.isArray(source.points)
      ? source.points.map(normalizeTrendPoint)
      : [],
    totals: {
      contacts: Math.max(0, Math.floor(number(totals.contacts))),
      connected: Math.max(0, Math.floor(number(totals.connected))),
    },
  };
}

function normalizeTrend(value: unknown): CtvSaleContactTrend {
  const source = asRecord(value) ?? {};
  const ranges = asRecord(source.ranges) ?? {};
  return {
    defaultRange: asRange(source.defaultRange ?? source.default_range),
    ranges: {
      "7d": normalizeTrendRange(ranges["7d"]),
      "30d": normalizeTrendRange(ranges["30d"]),
    },
  };
}

function normalizeOutcomes(value: unknown): CtvSaleContactOutcomes {
  const source = asRecord(value) ?? {};
  return {
    from: text(source.from),
    to: text(source.to),
    total: Math.max(0, Math.floor(number(source.total))),
    connectedRate: nullableNumber(
      source.connectedRate ?? source.connected_rate,
    ),
    items: Array.isArray(source.items)
      ? source.items.map((item): CtvSaleContactOutcomeItem => {
          const row = asRecord(item) ?? {};
          return {
            id: text(row.id, "other"),
            label: text(row.label, "Khác"),
            count: Math.max(0, Math.floor(number(row.count))),
            share: nullableNumber(row.share),
          };
        })
      : [],
  };
}

export function normalizeCtvSaleOverview(
  value: unknown,
): CtvSaleOverviewResponse {
  const payload = asRecord(unwrapMessage(value));
  const contacts = asRecord(payload?.contacts);
  const meta = asRecord(payload?.meta);
  const tasks = asRecord(payload?.tasks);
  const priority = asRecord(tasks?.priority);
  const summary = asRecord(tasks?.summary);
  const studentStatus = asRecord(payload?.studentStatus);
  const trend = asRecord(contacts?.trend);
  const trendRanges = asRecord(trend?.ranges);
  const outcomes = asRecord(contacts?.outcomes);
  if (
    !payload ||
    !Array.isArray(payload.kpis) ||
    !meta ||
    !priority ||
    !summary ||
    !Array.isArray(priority.items) ||
    !studentStatus ||
    !Array.isArray(studentStatus.items) ||
    !trend ||
    !trendRanges ||
    !asRecord(trendRanges["7d"]) ||
    !asRecord(trendRanges["30d"]) ||
    !outcomes ||
    !Array.isArray(outcomes.items)
  ) {
    throw new Error("Invalid CTV Sale overview response");
  }

  const result: CtvSaleOverviewResponse = {
    meta: normalizeMeta(meta),
    kpis: payload.kpis.map(normalizeKpi),
    tasks: normalizeTasks(tasks),
    studentStatus: normalizeStudentStatus(studentStatus),
    contacts: {
      trend: normalizeTrend(trend),
      outcomes: normalizeOutcomes(outcomes),
    },
  };

  const ids = new Set(result.kpis.map((item) => item.id));
  if (
    result.kpis.length !== KPI_IDS.length ||
    !KPI_IDS.every((id) => ids.has(id))
  ) {
    throw new Error("Incomplete CTV Sale overview response");
  }
  return result;
}

function resolveBaseUrl(options: RequestOptions): string {
  const baseUrl = (
    options.baseUrl ??
    process.env.NEXT_PUBLIC_FRAPPE_URL ??
    ""
  ).replace(/\/+$/, "");
  if (!baseUrl) {
    throw new CtvSaleOverviewApiError(
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
      `Không thể tải tổng quan CTV Sale (${status}).`,
  };
}

export async function getCtvSaleOverview(
  params: CtvSaleOverviewParams = {},
  options: RequestOptions = {},
): Promise<CtvSaleOverviewResponse> {
  const url = new URL(`${resolveBaseUrl(options)}/api/method/${METHOD}`);
  if (params.date) url.searchParams.set("date", params.date);
  url.searchParams.set("trendRange", params.trendRange ?? "7d");
  url.searchParams.set("outcomeRange", params.outcomeRange ?? "30d");
  if (params.timezone) url.searchParams.set("timezone", params.timezone);
  if (params.ctvId) url.searchParams.set("ctvId", params.ctvId);
  url.searchParams.set("priorityLimit", String(params.priorityLimit ?? 3));

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
    throw new CtvSaleOverviewApiError(
      503,
      "CTV_SALE_OVERVIEW_UNAVAILABLE",
      "Không thể kết nối đến máy chủ tổng quan CTV Sale.",
    );
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = errorDetails(payload, response.status);
    throw new CtvSaleOverviewApiError(
      response.status,
      error.code,
      error.message,
    );
  }

  try {
    return normalizeCtvSaleOverview(payload);
  } catch {
    throw new CtvSaleOverviewApiError(
      502,
      "INVALID_CTV_SALE_OVERVIEW_RESPONSE",
      "Phản hồi tổng quan CTV Sale không hợp lệ.",
    );
  }
}
