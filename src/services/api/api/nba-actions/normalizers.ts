import {
  ACTION_TIME_SLOTS,
  type ActionTimeSlot,
  type ActionChannel,
  type ActionExecutionType,
  type ListNbaActionTypesResponse,
  type ListNbaActionsResponse,
  type ListNbaTimeSlotsResponse,
  type NbaAction,
  type NbaActionType,
  type UpdateNbaActionResponse,
} from "./types";

type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : null;
}

function payloadFrom(value: unknown): RecordValue {
  const root = asRecord(value);
  const message = root?.message;
  const payload = asRecord(message) ?? root;
  if (!payload) throw new Error("response must contain an object payload");
  return payload;
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function booleanValue(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") return value === "1" || value === "true";
  return fallback;
}

function numberValue(value: unknown, fallback: number): number {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeTimeSlots(value: unknown): ActionTimeSlot[] {
  const parsed =
    typeof value === "string"
      ? (() => {
          try {
            return JSON.parse(value) as unknown;
          } catch {
            return null;
          }
        })()
      : value;
  if (!Array.isArray(parsed)) return [];
  return ACTION_TIME_SLOTS.filter((slot) => parsed.includes(slot));
}

function normalizeStringArray(value: unknown): string[] {
  const parsed =
    typeof value === "string"
      ? (() => {
          try {
            return JSON.parse(value) as unknown;
          } catch {
            return [];
          }
        })()
      : value;

  return Array.isArray(parsed)
    ? parsed.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeChannel(value: unknown): ActionChannel | null {
  return typeof value === "string" && ["NONE", "CALL", "EMAIL", "MESSAGE"].includes(value)
    ? (value as ActionChannel)
    : null;
}

function normalizeExecutionType(value: unknown): ActionExecutionType {
  return value === "AI_ASSISTED" ? "AI_ASSISTED" : "MANUAL";
}

function normalizeAction(value: unknown, fallbackName = ""): NbaAction {
  const action = asRecord(value);
  if (!action) throw new Error("action must be an object");

  const name = stringValue(action.name ?? action.code, fallbackName);
  const code = stringValue(action.code ?? action.name, name);

  if (!name) throw new Error("action.name must be a string");

  return {
    name,
    code,
    displayName: stringValue(
      action.display_name ?? action.displayName,
      code,
    ),
    actionType: nullableString(action.action_type ?? action.actionType),
    description: nullableString(action.description),
    purpose: nullableString(action.purpose),
    defaultChannel: normalizeChannel(action.default_channel ?? action.defaultChannel),
    allowedActors: normalizeStringArray(action.allowed_actors ?? action.allowedActors),
    allowedTimeSlots: normalizeTimeSlots(
      action.allowed_time_slots ?? action.allowedTimeSlots,
    ),
    requiresApproval: booleanValue(action.requires_approval ?? action.requiresApproval),
    autoExecute: booleanValue(action.auto_execute ?? action.autoExecute),
    executionType: normalizeExecutionType(action.execution_type ?? action.executionType),
    aiAllowed: booleanValue(action.ai_allowed ?? action.aiAllowed),
    enabled: booleanValue(action.enabled, true),
    sortOrder: numberValue(action.sort_order ?? action.sortOrder, 0),
    modified: nullableString(action.modified),
  };
}

function normalizeActionType(value: unknown): NbaActionType {
  const actionType = asRecord(value);
  if (!actionType) throw new Error("action_type must be an object");

  const name = stringValue(
    actionType.name ?? actionType.action_type ?? actionType.actionType,
  );
  if (!name) throw new Error("action_type.name must be a string");

  return {
    name,
    actionType: stringValue(
      actionType.action_type ?? actionType.actionType,
      name,
    ),
    displayName: stringValue(
      actionType.display_name ?? actionType.displayName,
      name,
    ),
    enabled: booleanValue(actionType.enabled, true),
  };
}

export function normalizeNbaActionsResponse(
  value: unknown,
): ListNbaActionsResponse {
  const payload = payloadFrom(value);
  const rawActions = Array.isArray(payload.actions) ? payload.actions : [];
  return {
    total: numberValue(payload.total, rawActions.length),
    start: numberValue(payload.start, 0),
    pageLength: numberValue(payload.page_length, rawActions.length || 20),
    actions: rawActions.map((action) => normalizeAction(action)),
  };
}

export function normalizeNbaActionTypesResponse(
  value: unknown,
): ListNbaActionTypesResponse {
  const payload = payloadFrom(value);
  const rawActionTypes = Array.isArray(payload.action_types)
    ? payload.action_types
    : Array.isArray(payload.actionTypes)
      ? payload.actionTypes
      : [];
  return {
    total: numberValue(payload.total, rawActionTypes.length),
    start: numberValue(payload.start, 0),
    pageLength: numberValue(
      payload.page_length,
      rawActionTypes.length || 20,
    ),
    actionTypes: rawActionTypes.map(normalizeActionType),
  };
}

export function normalizeNbaTimeSlotsResponse(
  value: unknown,
): ListNbaTimeSlotsResponse {
  const payload = payloadFrom(value);
  const timeSlots = normalizeTimeSlots(payload.time_slots ?? payload.timeSlots);
  return { timeSlots };
}

export function normalizeNbaActionUpdateResponse(
  value: unknown,
  fallbackName: string,
): UpdateNbaActionResponse {
  const payload = payloadFrom(value);
  const candidate = asRecord(payload.action) ?? payload;
  const action = candidate.name || candidate.code
    ? normalizeAction(candidate, fallbackName)
    : null;

  return {
    name: stringValue(payload.name, action?.name ?? fallbackName),
    action,
  };
}
