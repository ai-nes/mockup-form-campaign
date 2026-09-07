import {
  ACTION_TYPES,
  type ActionType,
  type NbaDisposition,
  type NbaPackageSeed,
} from "./types";
import type {
  ActionCommand,
  ActionCommandResponse,
  DirectorNextBestActionData,
  DirectorNextBestActionItem,
  DirectorNextBestActionMeta,
  DirectorNextBestActionOutcomes,
  DirectorNextBestActionQueue,
  DirectorNextBestActionSla,
  NextBestActionAiStatus,
  NextBestActionControlLevel,
  NextBestActionMetaStatus,
  NextBestActionPriority,
  NextBestActionRiskPriority,
  NextBestActionSlaTone,
  NextBestActionState,
  NextBestActionStatus,
} from "./types";

type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : null;
}

function payloadFrom(value: unknown): RecordValue {
  const root = asRecord(value);
  const payload = root?.message !== undefined ? asRecord(root.message) : root;
  if (!payload) throw new Error("response must contain an object payload");
  return payload;
}

function requiredString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim() === "")
    throw new Error(`${path} must be a string`);
  return value;
}

function textString(value: unknown, path: string): string {
  if (typeof value !== "string") throw new Error(`${path} must be a string`);
  return value;
}

function nullableString(value: unknown, path: string): string | null {
  if (value === null || value === undefined || value === "") return null;
  return requiredString(value, path);
}

function requiredNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new Error(`${path} must be a number`);
  return value;
}

function nullableNumber(value: unknown, path: string): number | null {
  if (value === null || value === undefined || value === "") return null;
  return requiredNumber(value, path);
}

function requiredBoolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${path} must be a boolean`);
  return value;
}

function arrayValue(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${path} must be an array`);
  return value;
}

function stringArray(value: unknown, path: string): string[] {
  return arrayValue(value, path).map((item, index) =>
    requiredString(item, `${path}[${index}]`),
  );
}

function enumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  path: string,
): T {
  if (!allowed.includes(value as T)) throw new Error(`${path} is invalid`);
  return value as T;
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function optionalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out = value.filter(
    (item): item is string => typeof item === "string" && item.trim() !== "",
  );
  return out.length > 0 ? out : undefined;
}

/**
 * snake_case → camelCase for the top-level keys of a record. The backend
 * already sends the package seed camelCased; this keeps the client correct if a
 * snake_case key ever slips through.
 */
export function camelizeKeys(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    out[key.replace(/_+([a-z0-9])/g, (_, char: string) => char.toUpperCase())] =
      item;
  }
  return out;
}

/**
 * Loose projection of a raw package seed: keep non-empty strings and
 * string-arrays, drop everything else. Cards read named fields; unknown extras
 * are harmless. Returns `null` when nothing usable survives.
 */
export function normalizePackageSeed(raw: unknown): NbaPackageSeed | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const camel = camelizeKeys(raw as Record<string, unknown>);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(camel)) {
    if (typeof value === "string") {
      if (value.trim() !== "") out[key] = value;
      continue;
    }
    const items = optionalStringArray(value);
    if (items) out[key] = items;
  }
  return Object.keys(out).length > 0 ? (out as NbaPackageSeed) : null;
}

function normalizeActionType(value: unknown): ActionType | null {
  return ACTION_TYPES.includes(value as ActionType)
    ? (value as ActionType)
    : null;
}

function normalizeDisposition(value: unknown): NbaDisposition {
  return value === "WAIT" ? "WAIT" : "ACT";
}

function normalizeMeta(value: unknown): DirectorNextBestActionMeta {
  const meta = asRecord(value);
  if (!meta) throw new Error("meta must be an object");
  const warnings =
    meta.warnings === null || meta.warnings === undefined
      ? null
      : stringArray(meta.warnings, "meta.warnings");

  return {
    admissionYear: requiredNumber(meta.admissionYear, "meta.admissionYear"),
    scope: requiredString(meta.scope, "meta.scope"),
    scopeLabel: requiredString(meta.scopeLabel, "meta.scopeLabel"),
    asOf: requiredString(meta.asOf, "meta.asOf"),
    timezone: requiredString(meta.timezone, "meta.timezone"),
    status: enumValue<NextBestActionMetaStatus>(
      meta.status,
      ["available", "partial", "ai_unavailable"],
      "meta.status",
    ),
    aiStatus: enumValue<NextBestActionAiStatus>(
      meta.aiStatus,
      ["available", "degraded", "unavailable"],
      "meta.aiStatus",
    ),
    modelVersion: nullableString(meta.modelVersion, "meta.modelVersion"),
    policyVersion: requiredString(meta.policyVersion, "meta.policyVersion"),
    warnings,
  };
}

function normalizeAction(
  value: unknown,
  index: number,
): DirectorNextBestActionItem {
  const action = asRecord(value);
  const path = `queue.actions[${index}]`;
  if (!action) throw new Error(`${path} must be an object`);

  const recentActivity = arrayValue(
    action.recentActivity,
    `${path}.recentActivity`,
  ).map((item, activityIndex) => {
    const activity = asRecord(item);
    const activityPath = `${path}.recentActivity[${activityIndex}]`;
    if (!activity) throw new Error(`${activityPath} must be an object`);
    return {
      id: requiredString(activity.id, `${activityPath}.id`),
      label: requiredString(activity.label, `${activityPath}.label`),
      occurredAt: textString(activity.occurredAt, `${activityPath}.occurredAt`),
      time: nullableString(activity.time, `${activityPath}.time`),
    };
  });

  return {
    id: requiredString(action.id, `${path}.id`),
    studentId: requiredString(action.studentId, `${path}.studentId`),
    studentName: requiredString(action.studentName, `${path}.studentName`),
    initials: requiredString(action.initials, `${path}.initials`),
    schoolId: nullableString(action.schoolId, `${path}.schoolId`),
    school: requiredString(action.school, `${path}.school`),
    interest: nullableString(action.interest, `${path}.interest`),
    recommendationCode: requiredString(
      action.recommendationCode,
      `${path}.recommendationCode`,
    ),
    recommendation: requiredString(
      action.recommendation,
      `${path}.recommendation`,
    ),
    summary: textString(action.summary, `${path}.summary`),
    dueAt: nullableString(action.dueAt, `${path}.dueAt`),
    dueLabel: requiredString(action.dueLabel, `${path}.dueLabel`),
    status: enumValue<NextBestActionStatus>(
      action.status,
      ["today", "soon", "overdue"],
      `${path}.status`,
    ),
    priority: enumValue<NextBestActionPriority>(
      action.priority,
      ["high", "medium", "low"],
      `${path}.priority`,
    ),
    impact: requiredString(action.impact, `${path}.impact`),
    currentProbability: nullableNumber(
      action.currentProbability,
      `${path}.currentProbability`,
    ),
    projectedProbability: nullableNumber(
      action.projectedProbability,
      `${path}.projectedProbability`,
    ),
    confidence: requiredNumber(action.confidence, `${path}.confidence`),
    suggestedAssigneeId: nullableString(
      action.suggestedAssigneeId,
      `${path}.suggestedAssigneeId`,
    ),
    suggestedAssignee: nullableString(
      action.suggestedAssignee,
      `${path}.suggestedAssignee`,
    ),
    evidence: stringArray(action.evidence, `${path}.evidence`),
    talkingPoints: stringArray(action.talkingPoints, `${path}.talkingPoints`),
    recentActivity,
    controlLevel: enumValue<NextBestActionControlLevel>(
      action.controlLevel,
      ["automatic", "review", "approval"],
      `${path}.controlLevel`,
    ),
    state: enumValue<NextBestActionState>(
      action.state,
      ["proposed", "assigned", "deferred", "dismissed", "expired"],
      `${path}.state`,
    ),
    generatedAt: textString(action.generatedAt, `${path}.generatedAt`),
    expiresAt: nullableString(action.expiresAt, `${path}.expiresAt`),
    version: requiredNumber(action.version, `${path}.version`),
    actionType: normalizeActionType(action.actionType),
    disposition: normalizeDisposition(action.disposition),
    packageSeed: normalizePackageSeed(action.packageSeed),
    whyNow: optionalString(action.whyNow),
    approach: optionalString(action.approach),
    expectedOutcome: optionalString(action.expectedOutcome),
    evidenceRefIds: optionalStringArray(action.evidenceRefIds) ?? [],
  };
}

function normalizeQueue(value: unknown): DirectorNextBestActionQueue {
  const queue = asRecord(value);
  if (!queue) throw new Error("queue must be an object");
  const counts = asRecord(queue.counts);
  const pagination = asRecord(queue.pagination);
  if (!counts || !pagination)
    throw new Error("queue must contain counts and pagination");

  return {
    actions: arrayValue(queue.actions, "queue.actions").map(normalizeAction),
    counts: {
      all: requiredNumber(counts.all, "queue.counts.all"),
      urgent: requiredNumber(counts.urgent, "queue.counts.urgent"),
      today: requiredNumber(counts.today, "queue.counts.today"),
      overdue: requiredNumber(counts.overdue, "queue.counts.overdue"),
      soon: requiredNumber(counts.soon, "queue.counts.soon"),
    },
    pagination: {
      page: requiredNumber(pagination.page, "queue.pagination.page"),
      pageSize: requiredNumber(
        pagination.pageSize,
        "queue.pagination.pageSize",
      ),
      total: requiredNumber(pagination.total, "queue.pagination.total"),
      hasNext: requiredBoolean(pagination.hasNext, "queue.pagination.hasNext"),
    },
  };
}

function normalizeSla(value: unknown): DirectorNextBestActionSla {
  const sla = asRecord(value);
  if (!sla) throw new Error("sla must be an object");

  return {
    responseWindowHours: requiredNumber(
      sla.responseWindowHours,
      "sla.responseWindowHours",
    ),
    onTimeRate: nullableNumber(sla.onTimeRate, "sla.onTimeRate"),
    onTimeDetail: requiredString(sla.onTimeDetail, "sla.onTimeDetail"),
    statusBuckets: arrayValue(sla.statusBuckets, "sla.statusBuckets").map(
      (value, index) => {
        const bucket = asRecord(value);
        const path = `sla.statusBuckets[${index}]`;
        if (!bucket) throw new Error(`${path} must be an object`);
        return {
          id: enumValue(
            bucket.id,
            ["within-sla", "due-soon", "overdue"],
            `${path}.id`,
          ),
          label: requiredString(bucket.label, `${path}.label`),
          count: requiredNumber(bucket.count, `${path}.count`),
          share: requiredNumber(bucket.share, `${path}.share`),
          detail: requiredString(bucket.detail, `${path}.detail`),
          tone: enumValue<NextBestActionSlaTone>(
            bucket.tone,
            ["success", "warning", "error"],
            `${path}.tone`,
          ),
        };
      },
    ),
    riskCases: arrayValue(sla.riskCases, "sla.riskCases").map(
      (value, index) => {
        const riskCase = asRecord(value);
        const path = `sla.riskCases[${index}]`;
        if (!riskCase) throw new Error(`${path} must be an object`);
        return {
          studentId: requiredString(riskCase.studentId, `${path}.studentId`),
          name: requiredString(riskCase.name, `${path}.name`),
          school: requiredString(riskCase.school, `${path}.school`),
          probability: nullableNumber(
            riskCase.probability,
            `${path}.probability`,
          ),
          silentForHours: nullableNumber(
            riskCase.silentForHours,
            `${path}.silentForHours`,
          ),
          silentFor: requiredString(riskCase.silentFor, `${path}.silentFor`),
          ownerId: nullableString(riskCase.ownerId, `${path}.ownerId`),
          owner: requiredString(riskCase.owner, `${path}.owner`),
          priority: enumValue<NextBestActionRiskPriority>(
            riskCase.priority,
            ["high", "watch"],
            `${path}.priority`,
          ),
          href: requiredString(riskCase.href, `${path}.href`),
        };
      },
    ),
    riskReasons: arrayValue(sla.riskReasons, "sla.riskReasons").map(
      (value, index) => {
        const reason = asRecord(value);
        const path = `sla.riskReasons[${index}]`;
        if (!reason) throw new Error(`${path} must be an object`);
        return {
          id: requiredString(reason.id, `${path}.id`),
          label: requiredString(reason.label, `${path}.label`),
          percentage: requiredNumber(reason.percentage, `${path}.percentage`),
          detail: requiredString(reason.detail, `${path}.detail`),
        };
      },
    ),
  };
}

function normalizeOutcomes(value: unknown): DirectorNextBestActionOutcomes {
  const outcomes = asRecord(value);
  if (!outcomes) throw new Error("outcomes must be an object");
  return {
    period: requiredString(outcomes.period, "outcomes.period"),
    rows: arrayValue(outcomes.rows, "outcomes.rows").map((value, index) => {
      const row = asRecord(value);
      const path = `outcomes.rows[${index}]`;
      if (!row) throw new Error(`${path} must be an object`);
      return {
        id: requiredString(row.id, `${path}.id`),
        label: requiredString(row.label, `${path}.label`),
        submitted: requiredNumber(row.submitted, `${path}.submitted`),
        accepted: requiredNumber(row.accepted, `${path}.accepted`),
        executed: requiredNumber(row.executed, `${path}.executed`),
        progressed: requiredNumber(row.progressed, `${path}.progressed`),
        transitionRate: nullableNumber(
          row.transitionRate,
          `${path}.transitionRate`,
        ),
      };
    }),
  };
}

function normalizeControlPolicy(
  value: unknown,
): DirectorNextBestActionData["controlPolicy"] {
  const policy = asRecord(value);
  if (!policy) throw new Error("controlPolicy must be an object");
  return {
    version: requiredString(policy.version, "controlPolicy.version"),
    rows: arrayValue(policy.rows, "controlPolicy.rows").map((value, index) => {
      const row = asRecord(value);
      const path = `controlPolicy.rows[${index}]`;
      if (!row) throw new Error(`${path} must be an object`);
      return {
        level: enumValue<NextBestActionControlLevel>(
          row.level,
          ["automatic", "review", "approval"],
          `${path}.level`,
        ),
        label: requiredString(row.label, `${path}.label`),
        actionTypes: stringArray(row.actionTypes, `${path}.actionTypes`),
        detail: requiredString(row.detail, `${path}.detail`),
        execution: enumValue(
          row.execution,
          ["system", "business-rule", "human-confirmation"],
          `${path}.execution`,
        ),
      };
    }),
  };
}

export function normalizeDirectorNextBestAction(
  value: unknown,
): DirectorNextBestActionData {
  const payload = payloadFrom(value);
  return {
    meta: normalizeMeta(payload.meta),
    queue: normalizeQueue(payload.queue),
    sla: normalizeSla(payload.sla),
    outcomes: normalizeOutcomes(payload.outcomes),
    controlPolicy: normalizeControlPolicy(payload.controlPolicy),
  };
}

export function normalizeActionCommandResponse(
  value: unknown,
): ActionCommandResponse {
  const payload = payloadFrom(value);
  const audit = asRecord(payload.audit);
  if (!audit) throw new Error("audit must be an object");
  return {
    actionId: requiredString(payload.actionId, "actionId"),
    command: enumValue<ActionCommand>(
      payload.command,
      ["assign", "defer", "dismiss"],
      "command",
    ),
    state: enumValue(
      payload.state,
      ["assigned", "deferred", "dismissed"],
      "state",
    ),
    version: requiredNumber(payload.version, "version"),
    appliedAt: requiredString(payload.appliedAt, "appliedAt"),
    deferUntil: nullableString(payload.deferUntil, "deferUntil"),
    replayed:
      payload.replayed === undefined
        ? false
        : requiredBoolean(payload.replayed, "replayed"),
    audit: {
      eventId: nullableString(audit.eventId, "audit.eventId"),
      actorId: requiredString(audit.actorId, "audit.actorId"),
      occurredAt: requiredString(audit.occurredAt, "audit.occurredAt"),
    },
  };
}
