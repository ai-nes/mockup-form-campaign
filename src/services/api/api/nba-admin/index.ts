import {
  normalizeActionType,
  normalizeConditionFields,
  normalizePreview,
  normalizeRule,
  normalizeTimingPolicy,
  unwrapMethodPayload,
} from "./normalizers";
import type {
  ConditionFieldMetadata,
  CreateActionTypePayload,
  ListActionTypesParams,
  ListActionTypesResponse,
  ListRulesParams,
  ListRulesResponse,
  ListTimingPoliciesParams,
  ListTimingPoliciesResponse,
  NbaAdminActionType,
  NbaRecommendationRule,
  NbaTimingPolicy,
  RecommendationRulePayload,
  RequestOptions,
  RuleConditions,
  RulePreviewPayload,
  RulePreviewResult,
  TimingPolicyPayload,
  UpdateActionTypePayload,
} from "./types";

export type * from "./types";

const METHODS = {
  LIST_ACTION_TYPES: "crm.api.action_type.list_action_types",
  GET_ACTION_TYPE: "crm.api.action_type.get_action_type",
  CREATE_ACTION_TYPE: "crm.api.action_type.create_action_type",
  UPDATE_ACTION_TYPE: "crm.api.action_type.update_action_type",
  DELETE_ACTION_TYPE: "crm.api.action_type.delete_action_type",
  LIST_RULES: "crm.api.recommendation_rule.list_rules",
  GET_RULE: "crm.api.recommendation_rule.get_rule",
  CREATE_RULE: "crm.api.recommendation_rule.create_rule",
  UPDATE_RULE: "crm.api.recommendation_rule.update_rule",
  PUBLISH_RULE: "crm.api.recommendation_rule.publish_rule",
  ARCHIVE_RULE: "crm.api.recommendation_rule.archive_rule",
  DELETE_RULE: "crm.api.recommendation_rule.delete_rule",
  PREVIEW_RULE: "crm.api.recommendation_rule.preview_rule",
  LIST_CONDITION_FIELDS: "crm.api.recommendation_rule.list_condition_fields",
} as const;

const TIMING_POLICY_DOCTYPE = encodeURIComponent("CRM Timing Policy");
const TIMING_POLICY_FIELDS = [
  "name",
  "policy_key",
  "trigger_type",
  "trigger_event",
  "delay_value",
  "delay_unit",
  "time_slot",
  "allowed_start_time",
  "allowed_end_time",
  "deadline_type",
  "deadline_offset",
  "recurrence_type",
  "recurrence_interval",
  "stop_condition",
  "optimization_enabled",
  "optimization_objective",
  "modified",
];

export class NbaAdminApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "NbaAdminApiError";
  }
}

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";
type QueryValue = string | number | boolean | undefined;
type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : null;
}

function resolveBaseUrl(options: RequestOptions = {}): string {
  const baseUrl = (options.baseUrl ?? process.env.NEXT_PUBLIC_FRAPPE_URL ?? "").replace(/\/+$/, "");
  if (!baseUrl) {
    throw new NbaAdminApiError(0, "FRAPPE_URL_MISSING", "Chưa cấu hình địa chỉ Frappe CRM API.");
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

async function requestHeaders(options: RequestOptions, isWrite: boolean): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(isWrite ? { "Content-Type": "application/json" } : {}),
    ...(options.headers ?? {}),
  };

  if (!options.baseUrl && typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const cookieHeader = frappeCookieHeader((await cookies()).toString());
      if (cookieHeader) headers.Cookie = cookieHeader;
    } catch {
      // Contract tests and non-request contexts do not have a Next request store.
    }
  }

  if (typeof window !== "undefined" && isWrite) {
    const csrfToken = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("csrf_token="))
      ?.split("=")
      .slice(1)
      .join("=");

    if (csrfToken) {
      headers["X-Frappe-CSRF-Token"] = decodeURIComponent(csrfToken);
    }
  }

  return headers;
}

function errorDetails(payload: unknown): { code?: string; message?: string } {
  const root = asRecord(payload);
  const message = asRecord(root?.message);
  const error = asRecord(root?.error) ?? asRecord(message?.error);
  return {
    code:
      typeof error?.code === "string"
        ? error.code
        : typeof root?.exc_type === "string"
          ? root.exc_type
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

async function requestJson<T>(
  path: string,
  requestMethod: RequestMethod,
  options: RequestOptions,
  query: Record<string, QueryValue> = {},
  body?: Record<string, unknown>,
): Promise<T> {
  const url = new URL(`${resolveBaseUrl(options)}${path}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  });

  const headers = await requestHeaders(options, requestMethod !== "GET");
  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: requestMethod,
      headers,
      ...(typeof window !== "undefined" ? { credentials: "include" as RequestCredentials } : {}),
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
    });
  } catch {
    throw new NbaAdminApiError(503, "NBA_ADMIN_API_UNAVAILABLE", "Không thể kết nối đến máy chủ cấu hình NBA.");
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = errorDetails(payload);
    throw new NbaAdminApiError(
      response.status,
      details.code ?? `HTTP_${response.status}`,
      details.message ?? "Thao tác cấu hình NBA thất bại.",
    );
  }

  return payload as T;
}

async function callMethod<T>(
  method: string,
  requestMethod: RequestMethod,
  options: RequestOptions = {},
  query: Record<string, QueryValue> = {},
  body?: Record<string, unknown>,
): Promise<T> {
  const raw = await requestJson<T>(`/api/method/${method}`, requestMethod, options, query, body);
  return unwrapMethodPayload(raw) as T;
}

async function callResource<T>(
  path: string,
  requestMethod: RequestMethod,
  options: RequestOptions = {},
  query: Record<string, QueryValue> = {},
  body?: Record<string, unknown>,
): Promise<T> {
  const raw = await requestJson<T>(`/api/resource/${path}`, requestMethod, options, query, body);
  const root = asRecord(raw);
  return (root?.data ?? raw) as T;
}

function numberValue(value: unknown, fallback: number): number {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function listValue(value: unknown, key: string): unknown[] {
  const payload = asRecord(value);
  return Array.isArray(payload?.[key]) ? payload[key] : [];
}

export async function listAdminActionTypes(
  params: ListActionTypesParams = {},
  options: RequestOptions = {},
): Promise<ListActionTypesResponse> {
  const raw = await callMethod<unknown>(METHODS.LIST_ACTION_TYPES, "GET", options, {
    enabled: params.enabled === undefined ? undefined : params.enabled ? 1 : 0,
    search: params.search,
    start: params.start ?? 0,
    page_length: params.pageLength ?? 100,
  });
  const payload = asRecord(raw);
  const rows = listValue(raw, "action_types").map(normalizeActionType);
  return {
    total: numberValue(payload?.total, rows.length),
    start: numberValue(payload?.start, params.start ?? 0),
    pageLength: numberValue(payload?.page_length, params.pageLength ?? 100),
    actionTypes: rows,
  };
}

export async function getAdminActionType(name: string, options: RequestOptions = {}): Promise<NbaAdminActionType> {
  return normalizeActionType(await callMethod(METHODS.GET_ACTION_TYPE, "GET", options, { name }));
}

export async function updateAdminActionType(
  payload: UpdateActionTypePayload,
  options: RequestOptions = {},
): Promise<NbaAdminActionType> {
  const raw = await callMethod(
    METHODS.UPDATE_ACTION_TYPE,
    "PUT",
    options,
    { name: payload.name },
    {
      ...(payload.displayName !== undefined ? { display_name: payload.displayName } : {}),
      ...(payload.enabled !== undefined ? { enabled: payload.enabled ? 1 : 0 } : {}),
      ...(payload.sortOrder !== undefined ? { sort_order: payload.sortOrder } : {}),
    },
  );
  return normalizeActionType(raw);
}

export async function createAdminActionType(
  payload: CreateActionTypePayload,
  options: RequestOptions = {},
): Promise<NbaAdminActionType> {
  const raw = await callMethod(METHODS.CREATE_ACTION_TYPE, "POST", options, {}, {
    action_type: payload.actionType,
    display_name: payload.displayName,
    enabled: payload.enabled ? 1 : 0,
    sort_order: payload.sortOrder,
  });
  return normalizeActionType(raw);
}

export async function deleteAdminActionType(name: string, options: RequestOptions = {}): Promise<void> {
  await callMethod(METHODS.DELETE_ACTION_TYPE, "DELETE", options, { name });
}

export async function listTimingPolicies(
  params: ListTimingPoliciesParams = {},
  options: RequestOptions = {},
): Promise<ListTimingPoliciesResponse> {
  const raw = await callResource<unknown[]>(TIMING_POLICY_DOCTYPE, "GET", options, {
    fields: JSON.stringify(TIMING_POLICY_FIELDS),
    limit_start: params.start ?? 0,
    limit_page_length: params.pageLength ?? 100,
  });
  const policies = (Array.isArray(raw) ? raw : []).map(normalizeTimingPolicy);
  return {
    total: policies.length,
    start: params.start ?? 0,
    pageLength: params.pageLength ?? 100,
    policies,
  };
}

export async function getTimingPolicy(name: string, options: RequestOptions = {}): Promise<NbaTimingPolicy> {
  return normalizeTimingPolicy(await callResource(`${TIMING_POLICY_DOCTYPE}/${encodeURIComponent(name)}`, "GET", options));
}

function timingPolicyBody(payload: TimingPolicyPayload): Record<string, unknown> {
  return {
    ...(payload.policyKey !== undefined ? { policy_key: payload.policyKey } : {}),
    trigger_type: payload.triggerType,
    ...(payload.triggerEvent !== undefined ? { trigger_event: payload.triggerEvent } : {}),
    ...(payload.delayValue !== undefined ? { delay_value: payload.delayValue } : {}),
    ...(payload.delayUnit !== undefined ? { delay_unit: payload.delayUnit } : {}),
    ...(payload.timeSlot !== undefined ? { time_slot: payload.timeSlot } : {}),
    ...(payload.allowedStartTime !== undefined ? { allowed_start_time: payload.allowedStartTime } : {}),
    ...(payload.allowedEndTime !== undefined ? { allowed_end_time: payload.allowedEndTime } : {}),
    ...(payload.deadlineType !== undefined ? { deadline_type: payload.deadlineType } : {}),
    ...(payload.deadlineOffset !== undefined ? { deadline_offset: payload.deadlineOffset } : {}),
    ...(payload.recurrenceType !== undefined ? { recurrence_type: payload.recurrenceType } : {}),
    ...(payload.recurrenceInterval !== undefined ? { recurrence_interval: payload.recurrenceInterval } : {}),
    ...(payload.stopCondition !== undefined ? { stop_condition: payload.stopCondition } : {}),
    ...(payload.optimizationEnabled !== undefined ? { optimization_enabled: payload.optimizationEnabled ? 1 : 0 } : {}),
    ...(payload.optimizationObjective !== undefined ? { optimization_objective: payload.optimizationObjective } : {}),
  };
}

export async function createTimingPolicy(payload: TimingPolicyPayload, options: RequestOptions = {}): Promise<NbaTimingPolicy> {
  return normalizeTimingPolicy(await callResource(TIMING_POLICY_DOCTYPE, "POST", options, {}, timingPolicyBody(payload)));
}

export async function updateTimingPolicy(
  name: string,
  payload: TimingPolicyPayload,
  options: RequestOptions = {},
): Promise<NbaTimingPolicy> {
  return normalizeTimingPolicy(await callResource(`${TIMING_POLICY_DOCTYPE}/${encodeURIComponent(name)}`, "PUT", options, {}, timingPolicyBody(payload)));
}

export async function deleteTimingPolicy(name: string, options: RequestOptions = {}): Promise<void> {
  await callResource(`${TIMING_POLICY_DOCTYPE}/${encodeURIComponent(name)}`, "DELETE", options);
}

export async function listRecommendationRules(
  params: ListRulesParams = {},
  options: RequestOptions = {},
): Promise<ListRulesResponse> {
  const raw = await callMethod<unknown>(METHODS.LIST_RULES, "GET", options, {
    status: params.status,
    enabled: params.enabled === undefined ? undefined : params.enabled ? 1 : 0,
    action_code: params.actionCode,
    trigger_type: params.triggerType,
    search: params.search,
    start: params.start ?? 0,
    page_length: params.pageLength ?? 100,
  });
  const payload = asRecord(raw);
  const rules = listValue(raw, "rules").map(normalizeRule);
  return {
    total: numberValue(payload?.total, rules.length),
    start: numberValue(payload?.start, params.start ?? 0),
    pageLength: numberValue(payload?.page_length, params.pageLength ?? 100),
    rules,
  };
}

export async function getRecommendationRule(name: string, options: RequestOptions = {}): Promise<NbaRecommendationRule> {
  return normalizeRule(await callMethod(METHODS.GET_RULE, "GET", options, { name }));
}

function ruleBody(payload: RecommendationRulePayload): Record<string, unknown> {
  return {
    ...(payload.ruleKey !== undefined ? { rule_key: payload.ruleKey } : {}),
    ...(payload.displayName !== undefined ? { display_name: payload.displayName } : {}),
    ...(payload.description !== undefined ? { description: payload.description } : {}),
    ...(payload.actionCode !== undefined ? { action_code: payload.actionCode } : {}),
    ...(payload.priority !== undefined ? { priority: payload.priority } : {}),
    ...(payload.triggerType !== undefined ? { trigger_type: payload.triggerType } : {}),
    ...(payload.triggerEvent !== undefined ? { trigger_event: payload.triggerEvent } : {}),
    ...(payload.conditions !== undefined ? { conditions: payload.conditions } : {}),
    ...(payload.timingPolicy !== undefined ? { timing_policy: payload.timingPolicy } : {}),
    ...(payload.cooldownValue !== undefined ? { cooldown_value: payload.cooldownValue } : {}),
    ...(payload.cooldownUnit !== undefined ? { cooldown_unit: payload.cooldownUnit } : {}),
    ...(payload.maxOccurrences !== undefined ? { max_occurrences: payload.maxOccurrences } : {}),
    ...(payload.expiresAfterHours !== undefined ? { expires_after_hours: payload.expiresAfterHours } : {}),
    ...(payload.stopConditions !== undefined ? { stop_conditions: payload.stopConditions } : {}),
  };
}

export async function createRecommendationRule(payload: RecommendationRulePayload, options: RequestOptions = {}): Promise<NbaRecommendationRule> {
  return normalizeRule(await callMethod(METHODS.CREATE_RULE, "POST", options, {}, ruleBody(payload)));
}

export async function updateRecommendationRule(
  name: string,
  payload: RecommendationRulePayload,
  options: RequestOptions = {},
): Promise<NbaRecommendationRule> {
  return normalizeRule(await callMethod(METHODS.UPDATE_RULE, "PUT", options, { name }, ruleBody(payload)));
}

export async function publishRecommendationRule(
  name: string,
  expectedVersion: number,
  options: RequestOptions = {},
): Promise<NbaRecommendationRule> {
  return normalizeRule(await callMethod(METHODS.PUBLISH_RULE, "POST", options, {}, { name, expected_version: expectedVersion }));
}

export async function archiveRecommendationRule(
  name: string,
  reason: string,
  options: RequestOptions = {},
): Promise<NbaRecommendationRule> {
  return normalizeRule(await callMethod(METHODS.ARCHIVE_RULE, "POST", options, {}, { name, reason }));
}

export async function deleteRecommendationRule(name: string, options: RequestOptions = {}): Promise<void> {
  await callMethod(METHODS.DELETE_RULE, "DELETE", options, { name });
}

export async function listConditionFields(options: RequestOptions = {}): Promise<ConditionFieldMetadata[]> {
  return normalizeConditionFields(await callMethod(METHODS.LIST_CONDITION_FIELDS, "GET", options));
}

export async function previewRecommendationRule(
  payload: RulePreviewPayload,
  options: RequestOptions = {},
): Promise<RulePreviewResult> {
  return normalizePreview(await callMethod(METHODS.PREVIEW_RULE, "POST", options, {}, {
    rule: {
      ...ruleBody(payload.rule),
      conditions: payload.rule.conditions ?? ({ all: [], any: [] } satisfies RuleConditions),
    },
    context: {
      student: payload.context.student,
      ...(payload.context.lifecycleStage ? { lifecycle_stage: payload.context.lifecycleStage } : {}),
      ...(payload.context.ownerStaff ? { owner_staff: payload.context.ownerStaff } : {}),
    },
  }));
}
