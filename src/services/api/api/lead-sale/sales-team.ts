export type SalesTeamWorkspaceStatus = "available" | "partial" | "unavailable";
export type SalesTeamMemberAvailability = "active" | "away" | "leave";
export type SalesTeamMemberHealth = "good" | "support";
export type SalesTeamAvailabilityFilter = "all" | SalesTeamMemberAvailability;
export type SalesTeamSort = "support" | "load" | "name";
export type SalesTeamOrder = "asc" | "desc";

export interface SalesTeamWorkspaceMeta {
  viewer: { id: string; displayName: string };
  team: { id: string; name: string };
  admissionYear: number;
  date: string;
  asOf: string;
  timezone: string;
  status: SalesTeamWorkspaceStatus;
  warnings: string[];
}

export interface SalesTeamSummary {
  memberCount: number;
  activeMemberCount: number;
  assignedStudents: number;
  totalCapacity: number;
  loadRate: number | null;
  supportMemberCount: number;
  overdueStudents: number;
}

export interface SalesTeamMember {
  id: string;
  displayName: string;
  email: string;
  availability: SalesTeamMemberAvailability;
  health: SalesTeamMemberHealth;
  activeStudents: number;
  capacity: number;
  loadRate: number | null;
  consultedToday: number;
  admittedThisMonth: number;
  overdue: number;
  conversionRate: number | null;
  regions: string[];
  specialties: string[];
  lastActivityAt: string | null;
  supportReason: string | null;
}

export interface SalesTeamAttentionItem {
  memberId: string;
  displayName: string;
  availability: SalesTeamMemberAvailability;
  health: "support";
  activeStudents: number;
  capacity: number;
  loadRate: number | null;
  overdue: number;
  supportReason: string;
}

export interface SalesTeamLoadItem {
  memberId: string;
  displayName: string;
  activeStudents: number;
  capacity: number;
  loadRate: number | null;
  health: SalesTeamMemberHealth;
}

export interface SalesTeamPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface SalesTeamWorkspaceResponse {
  meta: SalesTeamWorkspaceMeta;
  summary: SalesTeamSummary;
  attention: { count: number; items: SalesTeamAttentionItem[] };
  loadSummary: {
    assignedStudents: number;
    totalCapacity: number;
    loadRate: number | null;
    topMembers: SalesTeamLoadItem[];
  };
  members: SalesTeamMember[];
  pagination: SalesTeamPagination;
}

export interface SalesTeamMemberDetailResponse {
  meta: Pick<SalesTeamWorkspaceMeta, "admissionYear" | "date" | "asOf" | "timezone">;
  member: SalesTeamMember;
  healthAssessment: {
    status: SalesTeamMemberHealth;
    evaluatedAt: string;
    reasons: Array<{
      code: string;
      label: string;
      value: number;
      detail: string;
    }>;
  };
  metricWindow: {
    admissionYear: number;
    today: { from: string; to: string };
    month: { from: string; to: string };
  };
  permissions: { canViewStudents: boolean };
}

export interface SalesTeamWorkspaceParams {
  admissionYear?: number;
  date?: string;
  timezone?: string;
  availability?: SalesTeamAvailabilityFilter;
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: SalesTeamSort;
  order?: SalesTeamOrder;
}

export interface SalesTeamMemberDetailParams {
  memberId: string;
  admissionYear?: number;
  date?: string;
  timezone?: string;
}

export type SalesTeamRequestOptions = {
  baseUrl?: string;
  headers?: Record<string, string>;
};

export class SalesTeamApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "SalesTeamApiError";
  }
}

const WORKSPACE_METHOD = "crm.api.lead_sale.get_sales_team_workspace";
const DETAIL_METHOD = "crm.api.lead_sale.get_sales_team_member_detail";
const AVAILABILITIES = new Set<SalesTeamMemberAvailability>([
  "active",
  "away",
  "leave",
]);
const HEALTHS = new Set<SalesTeamMemberHealth>(["good", "support"]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function requiredText(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function nullableText(value: unknown, field: string): string | null {
  if (value === null || value === undefined || value === "") return null;
  return requiredText(value, field);
}

function count(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return value;
}

function rate(value: unknown, field: string): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`${field} must be between 0 and 100 or null`);
  }
  return value;
}

function stringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${field} must be an array of strings`);
  }
  return value;
}

function oneOf<T extends string>(value: unknown, values: Set<T>, field: string): T {
  if (typeof value !== "string" || !values.has(value as T)) {
    throw new Error(`${field} has an unsupported value`);
  }
  return value as T;
}

function valueOf(
  source: Record<string, unknown>,
  field: string,
  path: string,
  alias?: string,
): unknown {
  if (Object.prototype.hasOwnProperty.call(source, field)) return source[field];
  if (alias && Object.prototype.hasOwnProperty.call(source, alias)) return source[alias];
  throw new Error(`${path} is required`);
}

function unwrapMessage(value: unknown): unknown {
  const root = asRecord(value);
  if (!root || !("message" in root)) throw new Error("response.message is required");
  return root.message;
}

function normalizeMeta(value: unknown): SalesTeamWorkspaceMeta {
  const source = asRecord(value);
  const viewer = asRecord(source?.viewer);
  const team = asRecord(source?.team);
  if (!source || !viewer || !team || !Array.isArray(source.warnings)) {
    throw new Error("meta is incomplete");
  }
  const status = oneOf(
    source.status,
    new Set<SalesTeamWorkspaceStatus>(["available", "partial", "unavailable"]),
    "meta.status",
  );
  return {
    viewer: {
      id: requiredText(viewer.id, "meta.viewer.id"),
      displayName: requiredText(viewer.displayName ?? viewer.display_name, "meta.viewer.displayName"),
    },
    team: {
      id: requiredText(team.id, "meta.team.id"),
      name: requiredText(team.name, "meta.team.name"),
    },
    admissionYear: count(source.admissionYear ?? source.admission_year, "meta.admissionYear"),
    date: requiredText(source.date, "meta.date"),
    asOf: requiredText(source.asOf ?? source.as_of, "meta.asOf"),
    timezone: requiredText(source.timezone, "meta.timezone"),
    status,
    warnings: source.warnings.map((warning, index) => requiredText(warning, `meta.warnings[${index}]`)),
  };
}

function normalizeMember(value: unknown, path: string): SalesTeamMember {
  const source = asRecord(value);
  if (!source) throw new Error(`${path} must be an object`);
  return {
    id: requiredText(source.id, `${path}.id`),
    displayName: requiredText(source.displayName ?? source.display_name, `${path}.displayName`),
    email: requiredText(source.email, `${path}.email`),
    availability: oneOf(source.availability, AVAILABILITIES, `${path}.availability`),
    health: oneOf(source.health, HEALTHS, `${path}.health`),
    activeStudents: count(source.activeStudents ?? source.active_students, `${path}.activeStudents`),
    capacity: count(source.capacity, `${path}.capacity`),
    loadRate: rate(valueOf(source, "loadRate", `${path}.loadRate`, "load_rate"), `${path}.loadRate`),
    consultedToday: count(source.consultedToday ?? source.consulted_today, `${path}.consultedToday`),
    admittedThisMonth: count(
      source.admittedThisMonth ?? source.admitted_this_month,
      `${path}.admittedThisMonth`,
    ),
    overdue: count(source.overdue, `${path}.overdue`),
    conversionRate: rate(
      valueOf(source, "conversionRate", `${path}.conversionRate`, "conversion_rate"),
      `${path}.conversionRate`,
    ),
    regions: stringArray(source.regions, `${path}.regions`),
    specialties: stringArray(source.specialties, `${path}.specialties`),
    lastActivityAt: nullableText(
      valueOf(source, "lastActivityAt", `${path}.lastActivityAt`, "last_activity_at"),
      `${path}.lastActivityAt`,
    ),
    supportReason: nullableText(
      valueOf(source, "supportReason", `${path}.supportReason`, "support_reason"),
      `${path}.supportReason`,
    ),
  };
}

function normalizeSummary(value: unknown): SalesTeamSummary {
  const source = asRecord(value);
  if (!source) throw new Error("summary is required");
  return {
    memberCount: count(source.memberCount ?? source.member_count, "summary.memberCount"),
    activeMemberCount: count(
      source.activeMemberCount ?? source.active_member_count,
      "summary.activeMemberCount",
    ),
    assignedStudents: count(
      source.assignedStudents ?? source.assigned_students,
      "summary.assignedStudents",
    ),
    totalCapacity: count(source.totalCapacity ?? source.total_capacity, "summary.totalCapacity"),
    loadRate: rate(valueOf(source, "loadRate", "summary.loadRate", "load_rate"), "summary.loadRate"),
    supportMemberCount: count(
      source.supportMemberCount ?? source.support_member_count,
      "summary.supportMemberCount",
    ),
    overdueStudents: count(
      source.overdueStudents ?? source.overdue_students,
      "summary.overdueStudents",
    ),
  };
}

function normalizeAttention(value: unknown): SalesTeamAttentionItem[] {
  const source = asRecord(value);
  if (!source || !Array.isArray(source.items)) throw new Error("attention is incomplete");
  return source.items.map((item, index) => {
    const row = asRecord(item);
    if (!row) throw new Error(`attention.items[${index}] must be an object`);
    return {
      memberId: requiredText(row.memberId ?? row.member_id, `attention.items[${index}].memberId`),
      displayName: requiredText(
        row.displayName ?? row.display_name,
        `attention.items[${index}].displayName`,
      ),
      availability: oneOf(
        row.availability,
        AVAILABILITIES,
        `attention.items[${index}].availability`,
      ),
      health: oneOf(
        row.health,
        new Set<"support">(["support"]),
        `attention.items[${index}].health`,
      ),
      activeStudents: count(row.activeStudents ?? row.active_students, `attention.items[${index}].activeStudents`),
      capacity: count(row.capacity, `attention.items[${index}].capacity`),
      loadRate: rate(
        valueOf(row, "loadRate", `attention.items[${index}].loadRate`, "load_rate"),
        `attention.items[${index}].loadRate`,
      ),
      overdue: count(row.overdue, `attention.items[${index}].overdue`),
      supportReason: requiredText(
        row.supportReason ?? row.support_reason,
        `attention.items[${index}].supportReason`,
      ),
    };
  });
}

function normalizeLoadSummary(value: unknown): SalesTeamWorkspaceResponse["loadSummary"] {
  const source = asRecord(value);
  if (!source || !Array.isArray(source.topMembers)) throw new Error("loadSummary is incomplete");
  return {
    assignedStudents: count(
      source.assignedStudents ?? source.assigned_students,
      "loadSummary.assignedStudents",
    ),
    totalCapacity: count(source.totalCapacity ?? source.total_capacity, "loadSummary.totalCapacity"),
    loadRate: rate(
      valueOf(source, "loadRate", "loadSummary.loadRate", "load_rate"),
      "loadSummary.loadRate",
    ),
    topMembers: source.topMembers.map((item, index) => {
      const row = asRecord(item);
      if (!row) throw new Error(`loadSummary.topMembers[${index}] must be an object`);
      return {
        memberId: requiredText(
          row.memberId ?? row.member_id,
          `loadSummary.topMembers[${index}].memberId`,
        ),
        displayName: requiredText(
          row.displayName ?? row.display_name,
          `loadSummary.topMembers[${index}].displayName`,
        ),
        activeStudents: count(
          row.activeStudents ?? row.active_students,
          `loadSummary.topMembers[${index}].activeStudents`,
        ),
        capacity: count(row.capacity, `loadSummary.topMembers[${index}].capacity`),
        loadRate: rate(
          valueOf(row, "loadRate", `loadSummary.topMembers[${index}].loadRate`, "load_rate"),
          `loadSummary.topMembers[${index}].loadRate`,
        ),
        health: oneOf(row.health, HEALTHS, `loadSummary.topMembers[${index}].health`),
      };
    }),
  };
}

function normalizePagination(value: unknown): SalesTeamPagination {
  const source = asRecord(value);
  if (!source) throw new Error("pagination is required");
  return {
    page: count(source.page, "pagination.page"),
    pageSize: count(source.pageSize ?? source.page_size, "pagination.pageSize"),
    total: count(source.total, "pagination.total"),
    totalPages: count(source.totalPages ?? source.total_pages, "pagination.totalPages"),
    hasNextPage: source.hasNextPage === true || source.has_next_page === true,
  };
}

export function normalizeSalesTeamWorkspace(value: unknown): SalesTeamWorkspaceResponse {
  const source = asRecord(unwrapMessage(value));
  if (!source) throw new Error("workspace response must be an object");
  const attention = normalizeAttention(source.attention);
  const response = {
    meta: normalizeMeta(source.meta),
    summary: normalizeSummary(source.summary),
    attention: {
      count: count(asRecord(source.attention)?.count, "attention.count"),
      items: attention,
    },
    loadSummary: normalizeLoadSummary(source.loadSummary ?? source.load_summary),
    members: Array.isArray(source.members)
      ? source.members.map((item, index) => normalizeMember(item, `members[${index}]`))
      : (() => {
          throw new Error("members must be an array");
        })(),
    pagination: normalizePagination(source.pagination),
  };
  if (response.attention.count !== response.attention.items.length) {
    throw new Error("attention.count must match attention.items.length");
  }
  return response;
}

function normalizeDetail(value: unknown): SalesTeamMemberDetailResponse {
  const source = asRecord(unwrapMessage(value));
  const meta = asRecord(source?.meta);
  const healthAssessment = asRecord(source?.healthAssessment ?? source?.health_assessment);
  const metricWindow = asRecord(source?.metricWindow ?? source?.metric_window);
  const permissions = asRecord(source?.permissions);
  if (!source || !meta || !healthAssessment || !metricWindow || !permissions) {
    throw new Error("member detail response is incomplete");
  }
  const reasons = healthAssessment.reasons;
  const today = asRecord(metricWindow.today);
  const month = asRecord(metricWindow.month);
  if (!Array.isArray(reasons) || !today || !month) throw new Error("member detail metrics are incomplete");
  return {
    meta: {
      admissionYear: count(meta.admissionYear ?? meta.admission_year, "meta.admissionYear"),
      date: requiredText(meta.date, "meta.date"),
      asOf: requiredText(meta.asOf ?? meta.as_of, "meta.asOf"),
      timezone: requiredText(meta.timezone, "meta.timezone"),
    },
    member: normalizeMember(source.member, "member"),
    healthAssessment: {
      status: oneOf(healthAssessment.status, HEALTHS, "healthAssessment.status"),
      evaluatedAt: requiredText(healthAssessment.evaluatedAt ?? healthAssessment.evaluated_at, "healthAssessment.evaluatedAt"),
      reasons: reasons.map((value, index) => {
        const reason = asRecord(value);
        if (!reason) throw new Error(`healthAssessment.reasons[${index}] must be an object`);
        return {
          code: requiredText(reason.code, `healthAssessment.reasons[${index}].code`),
          label: requiredText(reason.label, `healthAssessment.reasons[${index}].label`),
          value: typeof reason.value === "number" && Number.isFinite(reason.value)
            ? reason.value
            : (() => {
                throw new Error(`healthAssessment.reasons[${index}].value must be a number`);
              })(),
          detail: requiredText(reason.detail, `healthAssessment.reasons[${index}].detail`),
        };
      }),
    },
    metricWindow: {
      admissionYear: count(
        metricWindow.admissionYear ?? metricWindow.admission_year,
        "metricWindow.admissionYear",
      ),
      today: {
        from: requiredText(today.from, "metricWindow.today.from"),
        to: requiredText(today.to, "metricWindow.today.to"),
      },
      month: {
        from: requiredText(month.from, "metricWindow.month.from"),
        to: requiredText(month.to, "metricWindow.month.to"),
      },
    },
    permissions: { canViewStudents: permissions.canViewStudents === true },
  };
}

function resolveBaseUrl(options: SalesTeamRequestOptions): string {
  const baseUrl = (options.baseUrl ?? process.env.NEXT_PUBLIC_FRAPPE_URL ?? "").replace(/\/+$/, "");
  if (!baseUrl) {
    throw new SalesTeamApiError(0, "FRAPPE_URL_MISSING", "Chưa cấu hình địa chỉ Frappe CRM API.");
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

async function requestHeaders(options: SalesTeamRequestOptions): Promise<Record<string, string>> {
  const headers: Record<string, string> = { Accept: "application/json", ...(options.headers ?? {}) };
  if (!options.baseUrl && typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const cookieHeader = frappeCookieHeader((await cookies()).toString());
      if (cookieHeader) headers.Cookie = cookieHeader;
    } catch {
      // Service tests and non-request contexts do not have Next headers.
    }
  }
  return headers;
}

function errorDetails(value: unknown, status: number): { code: string; message: string } {
  const root = asRecord(value);
  const error = asRecord(root?.error) ?? asRecord(asRecord(root?.message)?.error);
  return {
    code:
      (typeof error?.code === "string" && error.code) ||
      (status === 401 ? "UNAUTHENTICATED" : status === 403 ? "FORBIDDEN" : `HTTP_${status}`),
    message:
      (typeof error?.message === "string" && error.message) ||
      (typeof root?.exception === "string" && root.exception) ||
      `Không thể tải dữ liệu đội ngũ Sale (${status}).`,
  };
}

async function request(
  url: string,
  options: SalesTeamRequestOptions,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: await requestHeaders(options),
      ...(typeof window !== "undefined" ? { credentials: "include" as RequestCredentials } : {}),
      cache: "no-store",
    });
  } catch {
    throw new SalesTeamApiError(503, "SALES_TEAM_UNAVAILABLE", "Không thể kết nối đến máy chủ đội ngũ Sale.");
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = errorDetails(payload, response.status);
    throw new SalesTeamApiError(response.status, error.code, error.message);
  }
  return payload;
}

export async function getSalesTeamWorkspace(
  params: SalesTeamWorkspaceParams = {},
  options: SalesTeamRequestOptions = {},
): Promise<SalesTeamWorkspaceResponse> {
  const url = new URL(`${resolveBaseUrl(options)}/api/method/${WORKSPACE_METHOD}`);
  if (params.admissionYear !== undefined) url.searchParams.set("admissionYear", String(params.admissionYear));
  if (params.date) url.searchParams.set("date", params.date);
  if (params.timezone) url.searchParams.set("timezone", params.timezone);
  url.searchParams.set("availability", params.availability ?? "all");
  url.searchParams.set("q", params.q?.trim() ?? "");
  url.searchParams.set("page", String(params.page ?? 1));
  url.searchParams.set("pageSize", String(params.pageSize ?? 50));
  const sort = params.sort ?? "support";
  url.searchParams.set("sort", sort);
  url.searchParams.set("order", params.order ?? (sort === "name" ? "asc" : "desc"));

  const payload = await request(url.toString(), options);
  try {
    return normalizeSalesTeamWorkspace(payload);
  } catch {
    throw new SalesTeamApiError(
      502,
      "INVALID_SALES_TEAM_RESPONSE",
      "Phản hồi dữ liệu đội ngũ Sale không hợp lệ.",
    );
  }
}

export async function getSalesTeamMemberDetail(
  params: SalesTeamMemberDetailParams,
  options: SalesTeamRequestOptions = {},
): Promise<SalesTeamMemberDetailResponse> {
  const memberId = params.memberId.trim();
  if (!memberId) throw new SalesTeamApiError(400, "INVALID_QUERY", "memberId là bắt buộc.");
  const url = new URL(`${resolveBaseUrl(options)}/api/method/${DETAIL_METHOD}`);
  url.searchParams.set("memberId", memberId);
  if (params.admissionYear !== undefined) url.searchParams.set("admissionYear", String(params.admissionYear));
  if (params.date) url.searchParams.set("date", params.date);
  if (params.timezone) url.searchParams.set("timezone", params.timezone);

  const payload = await request(url.toString(), options);
  try {
    return normalizeDetail(payload);
  } catch {
    throw new SalesTeamApiError(
      502,
      "INVALID_SALES_TEAM_RESPONSE",
      "Phản hồi chi tiết thành viên Sale không hợp lệ.",
    );
  }
}
