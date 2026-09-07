import type {
  LeadSaleIntervention,
  LeadSaleInterventionId,
  LeadSaleKpi,
  LeadSaleOverviewMeta,
  LeadSaleOverviewParams,
  LeadSaleOverviewResponse,
  LeadSaleResultTrend,
  LeadSaleStudentStatus,
  LeadSaleStudentStatusId,
  LeadSaleTeamMember,
  LeadSaleTeamMemberStatus,
  LeadSaleTrendPoint,
  LeadSaleTrendRangeData,
} from "./types";

export type * from "./types";
export * from "./leads";
export * from "./campaigns";
export * from "./student-assignment";
export * from "./sales-team";

const METHOD = "crm.api.lead_sale.get_lead_sale_overview";
const KPI_IDS = [
  "active",
  "new",
  "unassigned",
  "needs-action",
  "overdue",
  "documents",
] as const;
const INTERVENTION_IDS = [
  "unassigned",
  "not-contacted",
  "at-risk",
  "blocked",
] as const;
const TEAM_STATUS_IDS = ["on-track", "needs-support"] as const;
const STUDENT_STATUS_IDS = [
  "consulting",
  "waiting",
  "documents",
  "admission",
  "new",
] as const;

export type RequestOptions = {
  baseUrl?: string;
  headers?: Record<string, string>;
};

export class LeadSaleOverviewApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "LeadSaleOverviewApiError";
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

function unwrapMessage(value: unknown): unknown {
  const root = asRecord(value);
  return root?.message !== undefined ? root.message : value;
}

function normalizeMeta(value: unknown): LeadSaleOverviewMeta {
  const source = asRecord(value) ?? {};
  const viewer = asRecord(source.viewer) ?? {};
  const team = asRecord(source.team) ?? {};
  const status = source.status;
  return {
    viewer: {
      id: text(viewer.id),
      displayName: text(viewer.displayName ?? viewer.display_name),
    },
    team: {
      id: text(team.id),
      name: text(team.name),
    },
    admissionYear: count(source.admissionYear ?? source.admission_year),
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

function normalizeKpi(value: unknown): LeadSaleKpi {
  const source = asRecord(value) ?? {};
  const id = KPI_IDS.includes(source.id as (typeof KPI_IDS)[number])
    ? (source.id as LeadSaleKpi["id"])
    : "active";
  return { id, value: count(source.value) };
}

function normalizeInterventions(value: unknown): {
  items: LeadSaleIntervention[];
} {
  const source = asRecord(value) ?? {};
  return {
    items: Array.isArray(source.items)
      ? source.items.map((item): LeadSaleIntervention => {
          const row = asRecord(item) ?? {};
          const id = INTERVENTION_IDS.includes(row.id as LeadSaleInterventionId)
            ? (row.id as LeadSaleInterventionId)
            : "blocked";
          return { id, count: count(row.count) };
        })
      : [],
  };
}

function normalizeTeamPerformance(value: unknown): {
  items: LeadSaleTeamMember[];
} {
  const source = asRecord(value) ?? {};
  return {
    items: Array.isArray(source.items)
      ? source.items.map((item): LeadSaleTeamMember => {
          const row = asRecord(item) ?? {};
          const status = TEAM_STATUS_IDS.includes(
            row.status as LeadSaleTeamMemberStatus,
          )
            ? (row.status as LeadSaleTeamMemberStatus)
            : "needs-support";
          return {
            id: text(row.id),
            displayName: text(row.displayName ?? row.display_name),
            activeStudents: count(row.activeStudents ?? row.active_students),
            consulted: count(row.consulted),
            admitted: count(row.admitted),
            status,
          };
        })
      : [],
  };
}

function normalizeStudentStatus(value: unknown): LeadSaleStudentStatus {
  const source = asRecord(value) ?? {};
  return {
    total: count(source.total),
    items: Array.isArray(source.items)
      ? source.items.map((item): LeadSaleStudentStatus["items"][number] => {
          const row = asRecord(item) ?? {};
          const id = STUDENT_STATUS_IDS.includes(
            row.id as LeadSaleStudentStatusId,
          )
            ? (row.id as LeadSaleStudentStatusId)
            : "new";
          const share = row.share;
          return {
            id,
            label: text(row.label),
            count: count(row.count),
            share:
              share === null || share === undefined ? null : number(share, 0),
          };
        })
      : [],
  };
}

function normalizeTrendPoint(value: unknown): LeadSaleTrendPoint {
  const source = asRecord(value) ?? {};
  return {
    label: text(source.label),
    periodStart: text(source.periodStart ?? source.period_start),
    periodEnd: text(source.periodEnd ?? source.period_end),
    consulted: count(source.consulted),
    admitted: count(source.admitted),
  };
}

function normalizeTrendRange(value: unknown): LeadSaleTrendRangeData {
  const source = asRecord(value) ?? {};
  return {
    from: text(source.from),
    to: text(source.to),
    points: Array.isArray(source.points)
      ? source.points.map(normalizeTrendPoint)
      : [],
  };
}

function normalizeTrend(value: unknown): LeadSaleResultTrend {
  const source = asRecord(value) ?? {};
  const ranges = asRecord(source.ranges) ?? {};
  return {
    defaultRange: source.defaultRange === "3m" ? "3m" : "4w",
    ranges: {
      "4w": normalizeTrendRange(ranges["4w"]),
      "3m": normalizeTrendRange(ranges["3m"]),
    },
  };
}

export function normalizeLeadSaleOverview(
  value: unknown,
): LeadSaleOverviewResponse {
  const payload = asRecord(unwrapMessage(value));
  const meta = asRecord(payload?.meta);
  const interventions = asRecord(payload?.interventions);
  const teamPerformance = asRecord(
    payload?.teamPerformance ?? payload?.team_performance,
  );
  const studentStatus = asRecord(
    payload?.studentStatus ?? payload?.student_status,
  );
  const resultTrend = asRecord(payload?.resultTrend ?? payload?.result_trend);
  const trendRanges = asRecord(resultTrend?.ranges);

  if (
    !payload ||
    !meta ||
    !asRecord(meta.team) ||
    !Array.isArray(payload.kpis) ||
    !interventions ||
    !Array.isArray(interventions.items) ||
    !teamPerformance ||
    !Array.isArray(teamPerformance.items) ||
    !studentStatus ||
    !Array.isArray(studentStatus.items) ||
    !resultTrend ||
    !trendRanges ||
    !asRecord(trendRanges["4w"]) ||
    !asRecord(trendRanges["3m"])
  ) {
    throw new Error("Invalid Lead Sale overview response");
  }

  const result: LeadSaleOverviewResponse = {
    meta: normalizeMeta(meta),
    kpis: payload.kpis.map(normalizeKpi),
    interventions: normalizeInterventions(interventions),
    teamPerformance: normalizeTeamPerformance(teamPerformance),
    studentStatus: normalizeStudentStatus(studentStatus),
    resultTrend: normalizeTrend(resultTrend),
  };

  const kpiIds = new Set(result.kpis.map((item) => item.id));
  const interventionIds = new Set(
    result.interventions.items.map((item) => item.id),
  );
  const statusIds = new Set(result.studentStatus.items.map((item) => item.id));
  if (
    result.kpis.length !== KPI_IDS.length ||
    !KPI_IDS.every((id) => kpiIds.has(id)) ||
    result.interventions.items.length !== INTERVENTION_IDS.length ||
    !INTERVENTION_IDS.every((id) => interventionIds.has(id)) ||
    result.studentStatus.items.length !== STUDENT_STATUS_IDS.length ||
    !STUDENT_STATUS_IDS.every((id) => statusIds.has(id)) ||
    result.studentStatus.items.reduce(
      (total, item) => total + item.count,
      0,
    ) !== result.studentStatus.total ||
    result.studentStatus.total !==
      result.kpis.find((item) => item.id === "active")?.value
  ) {
    throw new Error("Incomplete Lead Sale overview response");
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
    throw new LeadSaleOverviewApiError(
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
  value: unknown,
  status: number,
): { code: string; message: string } {
  const root = asRecord(value);
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
      `Không thể tải tổng quan Lead Sale (${status}).`,
  };
}

export async function getLeadSaleOverview(
  params: LeadSaleOverviewParams = {},
  options: RequestOptions = {},
): Promise<LeadSaleOverviewResponse> {
  const url = new URL(`${resolveBaseUrl(options)}/api/method/${METHOD}`);
  if (params.admissionYear !== undefined)
    url.searchParams.set("admissionYear", String(params.admissionYear));
  if (params.date) url.searchParams.set("date", params.date);
  url.searchParams.set("trendRange", params.trendRange ?? "4w");
  if (params.timezone) url.searchParams.set("timezone", params.timezone);
  url.searchParams.set("teamMemberLimit", String(params.teamMemberLimit ?? 20));

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
    throw new LeadSaleOverviewApiError(
      503,
      "LEAD_SALE_OVERVIEW_UNAVAILABLE",
      "Không thể kết nối đến máy chủ tổng quan Lead Sale.",
    );
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = errorDetails(payload, response.status);
    throw new LeadSaleOverviewApiError(
      response.status,
      error.code,
      error.message,
    );
  }

  try {
    return normalizeLeadSaleOverview(payload);
  } catch {
    throw new LeadSaleOverviewApiError(
      502,
      "INVALID_LEAD_SALE_OVERVIEW_RESPONSE",
      "Phản hồi tổng quan Lead Sale không hợp lệ.",
    );
  }
}
