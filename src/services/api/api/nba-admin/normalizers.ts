import { ACTION_TIME_SLOTS, type ActionTimeSlot } from "@/services/api/nba-actions";

import type {
  ActionChannel,
  ConditionFieldMetadata,
  NbaAdminActionType,
  NbaRecommendationRule,
  NbaTimingPolicy,
  RuleCondition,
  RuleConditions,
  RulePreviewResult,
} from "./types";

type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : null;
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function numberValue(value: unknown, fallback = 0): number {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function booleanValue(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") return value === "1" || value === "true";
  return fallback;
}

function enumValue<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === "string" && options.includes(value as T) ? (value as T) : fallback;
}

function jsonValue(value: unknown, fallback: unknown): unknown {
  if (typeof value !== "string") return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function stringArray(value: unknown): string[] {
  const parsed = jsonValue(value, []);
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
}

function timeSlot(value: unknown): ActionTimeSlot | null {
  return enumValue(value, ACTION_TIME_SLOTS, "" as ActionTimeSlot) || null;
}

function conditions(value: unknown): RuleConditions {
  const object = asRecord(jsonValue(value, {}));
  const read = (key: "all" | "any"): RuleCondition[] => {
    const rows = object?.[key];
    if (!Array.isArray(rows)) return [];
    return rows.flatMap((row) => {
      const condition = asRecord(row);
      if (!condition || typeof condition.field !== "string" || typeof condition.operator !== "string") {
        return [];
      }
      return [{
        field: condition.field,
        operator: condition.operator,
        value: condition.value as RuleCondition["value"],
      }];
    });
  };

  return { all: read("all"), any: read("any") };
}

export function unwrapMethodPayload(value: unknown): unknown {
  const root = asRecord(value);
  return root?.message ?? value;
}

export function normalizeActionType(value: unknown): NbaAdminActionType {
  const object = asRecord(value);
  if (!object) throw new Error("action type must be an object");
  const actionType = stringValue(object.action_type ?? object.actionType ?? object.name);
  if (!actionType) throw new Error("action type code is missing");

  return {
    name: stringValue(object.name, actionType),
    actionType,
    displayName: stringValue(object.display_name ?? object.displayName, actionType),
    enabled: booleanValue(object.enabled, true),
    sortOrder: numberValue(object.sort_order ?? object.sortOrder),
    modified: nullableString(object.modified),
  };
}

export function normalizeTimingPolicy(value: unknown): NbaTimingPolicy {
  const object = asRecord(value);
  if (!object) throw new Error("timing policy must be an object");
  const policyKey = stringValue(object.policy_key ?? object.policyKey ?? object.name);
  if (!policyKey) throw new Error("timing policy key is missing");

  return {
    name: stringValue(object.name, policyKey),
    policyKey,
    triggerType: enumValue(object.trigger_type ?? object.triggerType, ["event", "relative", "deadline", "schedule"], "relative"),
    triggerEvent: nullableString(object.trigger_event ?? object.triggerEvent),
    delayValue: numberValue(object.delay_value ?? object.delayValue),
    delayUnit: enumValue(object.delay_unit ?? object.delayUnit, ["minutes", "hours", "days"], "hours"),
    timeSlot: timeSlot(object.time_slot ?? object.timeSlot),
    allowedStartTime: nullableString(object.allowed_start_time ?? object.allowedStartTime),
    allowedEndTime: nullableString(object.allowed_end_time ?? object.allowedEndTime),
    deadlineType: enumValue(object.deadline_type ?? object.deadlineType, ["none", "fixed_offset", "business_days"], "none"),
    deadlineOffset: numberValue(object.deadline_offset ?? object.deadlineOffset),
    recurrenceType: enumValue(object.recurrence_type ?? object.recurrenceType, ["none", "daily", "weekly", "monthly"], "none"),
    recurrenceInterval: numberValue(object.recurrence_interval ?? object.recurrenceInterval, 1),
    stopCondition: nullableString(object.stop_condition ?? object.stopCondition),
    optimizationEnabled: booleanValue(object.optimization_enabled ?? object.optimizationEnabled),
    optimizationObjective: nullableString(object.optimization_objective ?? object.optimizationObjective),
    modified: nullableString(object.modified),
  };
}

export function normalizeRule(value: unknown): NbaRecommendationRule {
  const object = asRecord(value);
  if (!object) throw new Error("recommendation rule must be an object");
  const ruleKey = stringValue(object.rule_key ?? object.ruleKey ?? object.name);
  if (!ruleKey) throw new Error("recommendation rule key is missing");

  return {
    name: stringValue(object.name, ruleKey),
    ruleKey,
    displayName: stringValue(object.display_name ?? object.displayName, ruleKey),
    description: nullableString(object.description),
    status: enumValue(object.status, ["draft", "published", "archived"], "draft"),
    enabled: booleanValue(object.enabled),
    version: numberValue(object.version, 1),
    actionCode: stringValue(object.action_code ?? object.action ?? object.actionCode),
    priority: enumValue(object.priority, ["high", "medium", "low"], "medium"),
    triggerType: enumValue(object.trigger_type ?? object.triggerType, ["event", "state", "inactivity", "deadline", "manual"], "event"),
    triggerEvent: nullableString(object.trigger_event ?? object.triggerEvent),
    conditions: conditions(object.conditions),
    timingPolicy: nullableString(object.timing_policy ?? object.timingPolicy),
    cooldownValue: numberValue(object.cooldown_value ?? object.cooldownValue),
    cooldownUnit: enumValue(object.cooldown_unit ?? object.cooldownUnit, ["minutes", "hours", "days"], "days"),
    maxOccurrences: numberValue(object.max_occurrences ?? object.maxOccurrences, 1),
    expiresAfterHours:
      object.expires_after_hours === null || object.expires_after_hours === undefined
        ? null
        : numberValue(object.expires_after_hours ?? object.expiresAfterHours),
    stopConditions: stringArray(object.stop_conditions ?? object.stopConditions),
    publishedAt: nullableString(object.published_at ?? object.publishedAt),
    publishedBy: nullableString(object.published_by ?? object.publishedBy),
    archiveReason: nullableString(object.archive_reason ?? object.archiveReason),
    modified: nullableString(object.modified),
  };
}

export function normalizeConditionFields(value: unknown): ConditionFieldMetadata[] {
  const payload = asRecord(unwrapMethodPayload(value));
  const rows = Array.isArray(payload?.fields) ? payload.fields : [];
  return rows.flatMap((row) => {
    const object = asRecord(row);
    if (!object || typeof object.field !== "string") return [];
    return [{
      field: object.field,
      label: stringValue(object.label, object.field),
      type: stringValue(object.type, "text"),
      operators: Array.isArray(object.operators)
        ? object.operators.filter((item): item is string => typeof item === "string")
        : [],
      options: Array.isArray(object.options)
        ? object.options.filter((item): item is string => typeof item === "string")
        : undefined,
      optionsDoctype: nullableString(object.options_doctype ?? object.optionsDoctype),
    }];
  });
}

export function normalizePreview(value: unknown): RulePreviewResult {
  const object = asRecord(unwrapMethodPayload(value));
  const action = asRecord(object?.action);
  const timing = asRecord(object?.timing);
  const rawWarnings = Array.isArray(object?.warnings) ? object.warnings : [];

  return {
    eligible: booleanValue(object?.eligible),
    reasonCode: nullableString(object?.reason_code ?? object?.reasonCode) ?? undefined,
    reason: nullableString(object?.reason) ?? undefined,
    action: action
      ? {
          code: stringValue(action.code),
          displayName: stringValue(action.display_name ?? action.displayName, stringValue(action.code)),
          channel: enumValue(action.channel, ["NONE", "CALL", "EMAIL", "MESSAGE"], "NONE") as ActionChannel,
          executionType: stringValue(action.execution_type ?? action.executionType, "MANUAL"),
          available: booleanValue(action.available),
        }
      : undefined,
    timing: timing
      ? {
          policy: nullableString(timing.policy),
          nextAt: nullableString(timing.next_at ?? timing.nextAt),
          expiresAt: nullableString(timing.expires_at ?? timing.expiresAt),
        }
      : undefined,
    priority: enumValue(object?.priority, ["high", "medium", "low"], "medium") as RulePreviewResult["priority"],
    warnings: rawWarnings.flatMap((warning) => {
      const item = asRecord(warning);
      return item ? [{ code: stringValue(item.code, "WARNING"), message: stringValue(item.message) }] : [];
    }),
  };
}
