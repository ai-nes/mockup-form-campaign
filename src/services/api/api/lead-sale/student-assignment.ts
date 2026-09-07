const WORKSPACE_METHOD = "crm.api.lead_sale.get_student_assignment_workspace";
const DETAIL_METHOD = "crm.api.lead_sale.get_student_assignment_detail";
const RESOLVE_METHOD = "crm.api.lead_sale.resolve_student_assignment";
const RUN_PIPELINE_METHOD = "crm.api.lead_sale.run_student_assignment_pipeline";
const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";

const WORKFLOW_STEP_IDS = [
  "input",
  "validation",
  "classification",
  "matching",
  "review",
  "assignment",
] as const;

export type AssignmentWorkspaceStatus = "available" | "partial" | "unavailable";
export type AssignmentItemStatus =
  | "assigned"
  | "no_match"
  | "missing_data"
  | "error";
export type AssignmentFilter =
  | "all"
  | "assigned"
  | "review"
  | "no_match"
  | "missing_data"
  | "error";
export type AssignmentMethod = "automatic" | "manual";
export type WorkflowNodeStatus =
  | "idle"
  | "running"
  | "success"
  | "warning"
  | "error";
export type AssignmentWorkflowStepId = (typeof WORKFLOW_STEP_IDS)[number];
export type AssignmentWorkflowMode = "read-only" | "live";

export type StudentAssignmentWorkspaceParams = {
  admissionYear?: number;
  date?: string;
  timezone?: string;
  filter?: AssignmentFilter;
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: "receivedAt" | "name" | "status" | "owner" | "matchScore";
  order?: "asc" | "desc";
};

export type StudentAssignmentRequestOptions = {
  baseUrl?: string;
  headers?: Record<string, string>;
};

export type AssignmentOwner = { id: string; displayName: string };
export type AssignmentTeam = { id: string; name: string };

export type AssignmentItem = {
  studentId: string;
  name: string;
  school: string;
  region: string | null;
  interest: string | null;
  source: string | null;
  receivedAt: string;
  status: AssignmentItemStatus;
  owner: AssignmentOwner | null;
  matchScore: number | null;
  method: AssignmentMethod;
  reason: string | null;
  revision: number;
  executionId: string | null;
};

export type AssignmentWorkflowMetrics = {
  processedCount: number;
  successCount: number;
  warningCount: number;
  errorCount: number;
};

export type AssignmentWorkflowStep = {
  id: AssignmentWorkflowStepId;
  order: number;
  title: string;
  description: string;
  detail: string;
  rules: string[];
  status: WorkflowNodeStatus;
  metrics: AssignmentWorkflowMetrics;
};

export type AssignmentWorkflowConnection = {
  source: AssignmentWorkflowStepId;
  target: AssignmentWorkflowStepId;
  label: string | null;
};

export type AssignmentWorkspaceResponse = {
  meta: {
    viewer: AssignmentOwner;
    team: AssignmentTeam;
    admissionYear: number;
    date: string;
    asOf: string;
    timezone: string;
    status: AssignmentWorkspaceStatus;
    warnings: string[];
  };
  summary: {
    received: number;
    assigned: number;
    pending: number;
    byStatus: Record<AssignmentItemStatus, number>;
  };
  health: {
    automationEnabled: boolean;
    automationRate: number | null;
    successRate: number | null;
    reviewCount: number;
    errorCount: number;
    averageProcessingMs: number | null;
    policyVersion: string;
  };
  workflow: {
    mode: AssignmentWorkflowMode;
    version: string;
    steps: AssignmentWorkflowStep[];
    connections: AssignmentWorkflowConnection[];
  };
  items: AssignmentItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
};

export type RunStudentAssignmentPipelineRequest = {
  admissionYear?: number;
  timezone?: string;
  limit?: number;
};

export type AssignmentPipelineRun = {
  id: string;
  status: "completed" | "completed_with_errors";
  startedAt: string;
  completedAt: string;
  checked: number;
  assigned: number;
  deferred: number;
  failed: number;
  skipped: number;
};

export type AssignmentPipelineResult = {
  student: string;
  request: string | null;
  status: "applied" | "deferred" | "queued" | "failed" | "superseded";
  tier: number | string | null;
  queue: string | null;
  ownerStaff: string | null;
  reason: string | null;
  errorCode: string | null;
};

export type RunStudentAssignmentPipelineResponse = {
  run: AssignmentPipelineRun;
  results: AssignmentPipelineResult[];
};

export type AssignmentIssue = {
  code: string;
  message: string;
  missingFields: string[];
};

export type AssignmentCandidate = {
  id: string;
  displayName: string;
  activeStudents: number;
  capacity: number;
  remainingCapacity: number;
  matchScore: number;
  eligible: boolean;
  reasons: string[];
};

export type AssignmentExplainability = {
  policyVersion: string;
  matchScore: number | null;
  reasons: string[];
  criteria: Array<{
    code: string;
    label: string;
    result: string;
    detail: string;
  }>;
};

export type AssignmentEvent = {
  eventId: string;
  type: string;
  actor: AssignmentOwner | null;
  fromOwner: AssignmentOwner | null;
  toOwner: AssignmentOwner | null;
  reason: string | null;
  occurredAt: string;
};

export type AssignmentDetailResponse = {
  item: AssignmentItem;
  issue: AssignmentIssue | null;
  candidates: AssignmentCandidate[];
  explainability: AssignmentExplainability;
  events: AssignmentEvent[];
  permissions: { canResolve: boolean; canReassign: boolean };
};

export type ResolveStudentAssignmentRequest = {
  studentId: string;
  ownerId: string;
  region: string;
  reason: string;
  expectedRevision: number;
  idempotencyKey: string;
};

export type ResolveStudentAssignmentResponse = {
  studentId: string;
  command: "resolve";
  assignment: {
    owner: AssignmentOwner;
    status: "assigned";
    method: "manual";
    reason: string;
    appliedAt: string;
  };
  revision: number;
  audit: {
    eventId: string;
    actorId: string;
    occurredAt: string;
  };
};

export class StudentAssignmentApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "StudentAssignmentApiError";
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

function requiredText(value: unknown, field: string): string {
  const result = text(value).trim();
  if (!result) throw new Error(`${field} must be a non-empty string`);
  return result;
}

function finiteNumber(
  value: unknown,
  field: string,
  fallback?: number,
): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`${field} must be a finite number`);
}

function count(value: unknown, field: string): number {
  return Math.max(0, Math.floor(finiteNumber(value, field, 0)));
}

function nullableNumber(value: unknown, field: string): number | null {
  if (value === null || value === undefined) return null;
  return finiteNumber(value, field);
}

function unwrapMessage(value: unknown): unknown {
  const root = asRecord(value);
  return root?.message !== undefined ? root.message : value;
}

function oneOf<T extends string>(
  value: unknown,
  values: readonly T[],
  field: string,
): T {
  if (typeof value === "string" && values.includes(value as T)) {
    return value as T;
  }
  throw new Error(`${field} has an invalid value`);
}

function normalizeOwner(value: unknown, field: string): AssignmentOwner {
  const source = asRecord(value);
  if (!source) throw new Error(`${field} must be an object`);
  return {
    id: requiredText(source.id, `${field}.id`),
    displayName: requiredText(
      source.displayName ?? source.display_name,
      `${field}.displayName`,
    ),
  };
}

function normalizeTeam(value: unknown, field: string): AssignmentTeam {
  const source = asRecord(value);
  if (!source) throw new Error(`${field} must be an object`);
  return {
    id: requiredText(source.id, `${field}.id`),
    name: requiredText(source.name, `${field}.name`),
  };
}

function normalizeNullableOwner(
  value: unknown,
  field: string,
): AssignmentOwner | null {
  if (value === null || value === undefined) return null;
  return normalizeOwner(value, field);
}

function normalizeMetrics(
  value: unknown,
  field: string,
): AssignmentWorkflowMetrics {
  const source = asRecord(value);
  if (!source) throw new Error(`${field} must be an object`);
  return {
    processedCount: count(
      source.processedCount ?? source.processed_count,
      `${field}.processedCount`,
    ),
    successCount: count(
      source.successCount ?? source.success_count,
      `${field}.successCount`,
    ),
    warningCount: count(
      source.warningCount ?? source.warning_count,
      `${field}.warningCount`,
    ),
    errorCount: count(
      source.errorCount ?? source.error_count,
      `${field}.errorCount`,
    ),
  };
}

function normalizeItem(value: unknown, field: string): AssignmentItem {
  const source = asRecord(value);
  if (!source) throw new Error(`${field} must be an object`);
  return {
    studentId: requiredText(
      source.studentId ?? source.student_id,
      `${field}.studentId`,
    ),
    name: requiredText(source.name, `${field}.name`),
    school: requiredText(source.school, `${field}.school`),
    region:
      source.region === null || source.region === undefined
        ? null
        : text(source.region),
    interest:
      source.interest === null || source.interest === undefined
        ? null
        : text(source.interest),
    source:
      source.source === null || source.source === undefined
        ? null
        : text(source.source),
    receivedAt: requiredText(
      source.receivedAt ?? source.received_at,
      `${field}.receivedAt`,
    ),
    status: oneOf(
      source.status,
      ["assigned", "no_match", "missing_data", "error"] as const,
      `${field}.status`,
    ),
    owner: normalizeNullableOwner(source.owner, `${field}.owner`),
    matchScore: nullableNumber(
      source.matchScore ?? source.match_score,
      `${field}.matchScore`,
    ),
    method: oneOf(
      source.method,
      ["automatic", "manual"] as const,
      `${field}.method`,
    ),
    reason:
      source.reason === null || source.reason === undefined
        ? null
        : text(source.reason),
    revision: count(source.revision, `${field}.revision`),
    executionId:
      source.executionId === null || source.executionId === undefined
        ? null
        : text(source.executionId),
  };
}

function normalizeWorkspace(value: unknown): AssignmentWorkspaceResponse {
  const source = asRecord(value);
  if (!source) throw new Error("workspace must be an object");
  const meta = asRecord(source.meta);
  const summary = asRecord(source.summary);
  const byStatus = asRecord(summary?.byStatus);
  const health = asRecord(source.health);
  const workflow = asRecord(source.workflow);
  const pagination = asRecord(source.pagination);
  if (!meta || !summary || !byStatus || !health || !workflow || !pagination) {
    throw new Error("workspace is missing a required section");
  }

  const steps = Array.isArray(workflow.steps)
    ? workflow.steps.map((value, index) => {
        const step = asRecord(value);
        if (!step)
          throw new Error(`workflow.steps[${index}] must be an object`);
        return {
          id: oneOf(step.id, WORKFLOW_STEP_IDS, `workflow.steps[${index}].id`),
          order: count(step.order, `workflow.steps[${index}].order`),
          title: requiredText(step.title, `workflow.steps[${index}].title`),
          description: requiredText(
            step.description,
            `workflow.steps[${index}].description`,
          ),
          detail: requiredText(step.detail, `workflow.steps[${index}].detail`),
          rules: Array.isArray(step.rules)
            ? step.rules.map((rule, ruleIndex) =>
                requiredText(
                  rule,
                  `workflow.steps[${index}].rules[${ruleIndex}]`,
                ),
              )
            : [],
          status: oneOf(
            step.status,
            ["idle", "running", "success", "warning", "error"] as const,
            `workflow.steps[${index}].status`,
          ),
          metrics: normalizeMetrics(
            step.metrics,
            `workflow.steps[${index}].metrics`,
          ),
        };
      })
    : [];
  if (
    steps.length !== WORKFLOW_STEP_IDS.length ||
    !WORKFLOW_STEP_IDS.every((id) => steps.some((step) => step.id === id))
  ) {
    throw new Error("workflow must contain all six steps");
  }

  const connections = Array.isArray(workflow.connections)
    ? workflow.connections.map((value, index) => {
        const connection = asRecord(value);
        if (!connection)
          throw new Error(`workflow.connections[${index}] must be an object`);
        return {
          source: oneOf(
            connection.source,
            WORKFLOW_STEP_IDS,
            `workflow.connections[${index}].source`,
          ),
          target: oneOf(
            connection.target,
            WORKFLOW_STEP_IDS,
            `workflow.connections[${index}].target`,
          ),
          label:
            connection.label === null || connection.label === undefined
              ? null
              : text(connection.label),
        };
      })
    : [];

  const normalized: AssignmentWorkspaceResponse = {
    meta: {
      viewer: normalizeOwner(meta.viewer, "meta.viewer"),
      team: normalizeTeam(meta.team, "meta.team"),
      admissionYear: count(
        meta.admissionYear ?? meta.admission_year,
        "meta.admissionYear",
      ),
      date: requiredText(meta.date, "meta.date"),
      asOf: requiredText(meta.asOf ?? meta.as_of, "meta.asOf"),
      timezone: text(meta.timezone, DEFAULT_TIMEZONE),
      status: oneOf(
        meta.status,
        ["available", "partial", "unavailable"] as const,
        "meta.status",
      ),
      warnings: Array.isArray(meta.warnings)
        ? meta.warnings.map((warning, index) =>
            requiredText(warning, `meta.warnings[${index}]`),
          )
        : [],
    },
    summary: {
      received: count(summary.received, "summary.received"),
      assigned: count(summary.assigned, "summary.assigned"),
      pending: count(summary.pending, "summary.pending"),
      byStatus: {
        assigned: count(byStatus.assigned, "summary.byStatus.assigned"),
        no_match: count(byStatus.no_match, "summary.byStatus.no_match"),
        missing_data: count(
          byStatus.missing_data,
          "summary.byStatus.missing_data",
        ),
        error: count(byStatus.error, "summary.byStatus.error"),
      },
    },
    health: {
      automationEnabled: Boolean(
        health.automationEnabled ?? health.automation_enabled,
      ),
      automationRate: nullableNumber(
        health.automationRate ?? health.automation_rate,
        "health.automationRate",
      ),
      successRate: nullableNumber(
        health.successRate ?? health.success_rate,
        "health.successRate",
      ),
      reviewCount: count(
        health.reviewCount ?? health.review_count,
        "health.reviewCount",
      ),
      errorCount: count(
        health.errorCount ?? health.error_count,
        "health.errorCount",
      ),
      averageProcessingMs: nullableNumber(
        health.averageProcessingMs ?? health.average_processing_ms,
        "health.averageProcessingMs",
      ),
      policyVersion: requiredText(
        health.policyVersion ?? health.policy_version,
        "health.policyVersion",
      ),
    },
    workflow: {
      mode: oneOf(
        workflow.mode,
        ["read-only", "live"] as const,
        "workflow.mode",
      ),
      version: requiredText(workflow.version, "workflow.version"),
      steps,
      connections,
    },
    items: Array.isArray(source.items)
      ? source.items.map((item, index) =>
          normalizeItem(item, `items[${index}]`),
        )
      : (() => {
          throw new Error("items must be an array");
        })(),
    pagination: {
      page: count(pagination.page, "pagination.page"),
      pageSize: count(
        pagination.pageSize ?? pagination.page_size,
        "pagination.pageSize",
      ),
      total: count(pagination.total, "pagination.total"),
      totalPages: count(
        pagination.totalPages ?? pagination.total_pages,
        "pagination.totalPages",
      ),
      hasNextPage: Boolean(pagination.hasNextPage ?? pagination.has_next_page),
    },
  };

  const summaryTotal = Object.values(normalized.summary.byStatus).reduce(
    (total, value) => total + value,
    0,
  );
  if (
    normalized.summary.received !== summaryTotal ||
    normalized.summary.assigned !== normalized.summary.byStatus.assigned ||
    normalized.summary.pending !==
      normalized.summary.received - normalized.summary.assigned
  ) {
    throw new Error("workspace summary counts violate the contract");
  }
  return normalized;
}

function normalizeDetail(value: unknown): AssignmentDetailResponse {
  const source = asRecord(value);
  if (!source) throw new Error("detail must be an object");
  const issueSource =
    source.issue === null || source.issue === undefined
      ? null
      : asRecord(source.issue);
  const explainability = asRecord(source.explainability);
  const permissions = asRecord(source.permissions);
  if (
    !explainability ||
    !permissions ||
    !Array.isArray(source.candidates) ||
    !Array.isArray(source.events)
  ) {
    throw new Error("detail is missing a required section");
  }
  const missingFieldsValue =
    issueSource?.missingFields ?? issueSource?.missing_fields;
  const missingFields = Array.isArray(missingFieldsValue)
    ? missingFieldsValue
    : [];
  return {
    item: normalizeItem(source.item, "item"),
    issue: issueSource
      ? {
          code: requiredText(issueSource.code, "issue.code"),
          message: requiredText(issueSource.message, "issue.message"),
          missingFields: missingFields.map((field, index) =>
            requiredText(field, `issue.missingFields[${index}]`),
          ),
        }
      : null,
    candidates: source.candidates.map((value, index) => {
      const candidate = asRecord(value);
      if (!candidate) throw new Error(`candidates[${index}] must be an object`);
      return {
        id: requiredText(candidate.id, `candidates[${index}].id`),
        displayName: requiredText(
          candidate.displayName ?? candidate.display_name,
          `candidates[${index}].displayName`,
        ),
        activeStudents: count(
          candidate.activeStudents ?? candidate.active_students,
          `candidates[${index}].activeStudents`,
        ),
        capacity: count(candidate.capacity, `candidates[${index}].capacity`),
        remainingCapacity: count(
          candidate.remainingCapacity ?? candidate.remaining_capacity,
          `candidates[${index}].remainingCapacity`,
        ),
        matchScore: finiteNumber(
          candidate.matchScore ?? candidate.match_score,
          `candidates[${index}].matchScore`,
          0,
        ),
        eligible: Boolean(candidate.eligible),
        reasons: Array.isArray(candidate.reasons)
          ? candidate.reasons.map((reason, reasonIndex) =>
              requiredText(
                reason,
                `candidates[${index}].reasons[${reasonIndex}]`,
              ),
            )
          : [],
      };
    }),
    explainability: {
      policyVersion: requiredText(
        explainability.policyVersion ?? explainability.policy_version,
        "explainability.policyVersion",
      ),
      matchScore: nullableNumber(
        explainability.matchScore ?? explainability.match_score,
        "explainability.matchScore",
      ),
      reasons: Array.isArray(explainability.reasons)
        ? explainability.reasons.map((reason, index) =>
            requiredText(reason, `explainability.reasons[${index}]`),
          )
        : [],
      criteria: Array.isArray(explainability.criteria)
        ? explainability.criteria.map((value, index) => {
            const criterion = asRecord(value);
            if (!criterion)
              throw new Error(
                `explainability.criteria[${index}] must be an object`,
              );
            return {
              code: requiredText(
                criterion.code,
                `explainability.criteria[${index}].code`,
              ),
              label: requiredText(
                criterion.label,
                `explainability.criteria[${index}].label`,
              ),
              result: requiredText(
                criterion.result,
                `explainability.criteria[${index}].result`,
              ),
              detail: requiredText(
                criterion.detail,
                `explainability.criteria[${index}].detail`,
              ),
            };
          })
        : [],
    },
    events: source.events.map((value, index) => {
      const event = asRecord(value);
      if (!event) throw new Error(`events[${index}] must be an object`);
      return {
        eventId: requiredText(
          event.eventId ?? event.event_id,
          `events[${index}].eventId`,
        ),
        type: requiredText(event.type, `events[${index}].type`),
        actor: normalizeNullableOwner(event.actor, `events[${index}].actor`),
        fromOwner: normalizeNullableOwner(
          event.fromOwner ?? event.from_owner,
          `events[${index}].fromOwner`,
        ),
        toOwner: normalizeNullableOwner(
          event.toOwner ?? event.to_owner,
          `events[${index}].toOwner`,
        ),
        reason:
          event.reason === null || event.reason === undefined
            ? null
            : text(event.reason),
        occurredAt: requiredText(
          event.occurredAt ?? event.occurred_at,
          `events[${index}].occurredAt`,
        ),
      };
    }),
    permissions: {
      canResolve: Boolean(permissions.canResolve ?? permissions.can_resolve),
      canReassign: Boolean(permissions.canReassign ?? permissions.can_reassign),
    },
  };
}

function normalizeResolve(value: unknown): ResolveStudentAssignmentResponse {
  const source = asRecord(value);
  const assignment = asRecord(source?.assignment);
  const audit = asRecord(source?.audit);
  const owner = assignment?.owner;
  if (!source || !assignment || !audit)
    throw new Error("resolve response is incomplete");
  return {
    studentId: requiredText(source.studentId ?? source.student_id, "studentId"),
    command: oneOf(source.command, ["resolve"] as const, "command"),
    assignment: {
      owner: normalizeOwner(owner, "assignment.owner"),
      status: oneOf(
        assignment.status,
        ["assigned"] as const,
        "assignment.status",
      ),
      method: oneOf(
        assignment.method,
        ["manual"] as const,
        "assignment.method",
      ),
      reason: requiredText(assignment.reason, "assignment.reason"),
      appliedAt: requiredText(
        assignment.appliedAt ?? assignment.applied_at,
        "assignment.appliedAt",
      ),
    },
    revision: count(source.revision, "revision"),
    audit: {
      eventId: requiredText(audit.eventId ?? audit.event_id, "audit.eventId"),
      actorId: requiredText(audit.actorId ?? audit.actor_id, "audit.actorId"),
      occurredAt: requiredText(
        audit.occurredAt ?? audit.occurred_at,
        "audit.occurredAt",
      ),
    },
  };
}

function nullableText(value: unknown): string | null {
  return value === null || value === undefined ? null : text(value);
}

function nullableTextOrNumber(value: unknown): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  throw new Error("pipeline result tier must be a string or number");
}

function normalizePipelineRun(
  value: unknown,
  field: string,
): AssignmentPipelineRun {
  const source = asRecord(value);
  if (!source) throw new Error(`${field} must be an object`);
  return {
    id: requiredText(source.id, `${field}.id`),
    status: oneOf(
      source.status,
      ["completed", "completed_with_errors"] as const,
      `${field}.status`,
    ),
    startedAt: requiredText(
      source.startedAt ?? source.started_at,
      `${field}.startedAt`,
    ),
    completedAt: requiredText(
      source.completedAt ?? source.completed_at,
      `${field}.completedAt`,
    ),
    checked: count(source.checked, `${field}.checked`),
    assigned: count(source.assigned, `${field}.assigned`),
    deferred: count(source.deferred, `${field}.deferred`),
    failed: count(source.failed, `${field}.failed`),
    skipped: count(source.skipped, `${field}.skipped`),
  };
}

function normalizePipelineResult(
  value: unknown,
  field: string,
): AssignmentPipelineResult {
  const source = asRecord(value);
  if (!source) throw new Error(`${field} must be an object`);
  return {
    student: requiredText(source.student, `${field}.student`),
    request: nullableText(source.request),
    status: oneOf(
      source.status,
      ["applied", "deferred", "queued", "failed", "superseded"] as const,
      `${field}.status`,
    ),
    tier: nullableTextOrNumber(source.tier),
    queue: nullableText(source.queue),
    ownerStaff: nullableText(source.ownerStaff ?? source.owner_staff),
    reason: nullableText(source.reason),
    errorCode: nullableText(source.errorCode ?? source.error_code),
  };
}

export function normalizeStudentAssignmentWorkspace(
  value: unknown,
): AssignmentWorkspaceResponse {
  return normalizeWorkspace(unwrapMessage(value));
}

export function normalizeStudentAssignmentDetail(
  value: unknown,
): AssignmentDetailResponse {
  return normalizeDetail(unwrapMessage(value));
}

export function normalizeResolvedStudentAssignment(
  value: unknown,
): ResolveStudentAssignmentResponse {
  return normalizeResolve(unwrapMessage(value));
}

export function normalizeRunStudentAssignmentPipeline(
  value: unknown,
): RunStudentAssignmentPipelineResponse {
  const source = asRecord(unwrapMessage(value));
  if (!source || !Array.isArray(source.results)) {
    throw new Error("pipeline response is incomplete");
  }
  return {
    run: normalizePipelineRun(source.run, "run"),
    results: source.results.map((result, index) =>
      normalizePipelineResult(result, `results[${index}]`),
    ),
  };
}

function resolveBaseUrl(options: StudentAssignmentRequestOptions): string {
  const baseUrl = (
    options.baseUrl ??
    process.env.NEXT_PUBLIC_FRAPPE_URL ??
    ""
  ).replace(/\/+$/, "");
  if (!baseUrl) {
    throw new StudentAssignmentApiError(
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
  options: StudentAssignmentRequestOptions,
  contentType = false,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers ?? {}),
  };
  if (contentType) headers["Content-Type"] = "application/json";

  if (!options.baseUrl && typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const cookieHeader = frappeCookieHeader((await cookies()).toString());
      if (cookieHeader) headers.Cookie = cookieHeader;
    } catch {
      // Service tests and non-request contexts do not have Next headers.
    }
  }

  if (typeof window !== "undefined" && contentType) {
    const csrfToken = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("csrf_token="))
      ?.split("=")
      .slice(1)
      .join("=");
    if (csrfToken) {
      headers["X-Frappe-CSRF-Token"] = decodeURIComponent(csrfToken);
    } else {
      try {
        const sessionResponse = await fetch(
          `${resolveBaseUrl(options)}/api/method/crm.api.session.me`,
          { credentials: "include", headers: { Accept: "application/json" } },
        );
        const payload = (await sessionResponse.json().catch(() => null)) as {
          message?: { csrf_token?: unknown };
        } | null;
        if (typeof payload?.message?.csrf_token === "string") {
          headers["X-Frappe-CSRF-Token"] = payload.message.csrf_token;
        }
      } catch {
        // The write request returns the authoritative CSRF error if needed.
      }
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
      text(message?.code) ||
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
      `Không thể gọi API phân công học sinh (${status}).`,
  };
}

async function parseResponse(response: Response): Promise<unknown> {
  return response.json().catch(() => ({}));
}

async function request(url: string, init: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      ...(typeof window !== "undefined"
        ? { credentials: "include" as RequestCredentials }
        : {}),
      cache: "no-store",
    });
  } catch {
    throw new StudentAssignmentApiError(
      503,
      "STUDENT_ASSIGNMENT_UNAVAILABLE",
      "Không thể kết nối tới dịch vụ phân công học sinh.",
    );
  }

  const payload = await parseResponse(response);
  if (!response.ok) {
    const details = errorDetails(payload, response.status);
    throw new StudentAssignmentApiError(
      response.status,
      details.code,
      details.message,
    );
  }
  return payload;
}

export async function getStudentAssignmentWorkspace(
  params: StudentAssignmentWorkspaceParams = {},
  options: StudentAssignmentRequestOptions = {},
): Promise<AssignmentWorkspaceResponse> {
  const query = new URLSearchParams();
  if (params.admissionYear !== undefined)
    query.set("admissionYear", String(params.admissionYear));
  if (params.date) query.set("date", params.date);
  if (params.timezone) query.set("timezone", params.timezone);
  query.set("filter", params.filter ?? "all");
  query.set("q", params.q ?? "");
  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 20));
  query.set("sort", params.sort ?? "receivedAt");
  query.set("order", params.order ?? "desc");
  const payload = await request(
    `${resolveBaseUrl(options)}/api/method/${WORKSPACE_METHOD}?${query.toString()}`,
    { method: "GET", headers: await requestHeaders(options) },
  );
  try {
    return normalizeStudentAssignmentWorkspace(payload);
  } catch {
    throw new StudentAssignmentApiError(
      502,
      "INVALID_ASSIGNMENT_RESPONSE",
      "Phản hồi workspace phân công học sinh không hợp lệ.",
    );
  }
}

export async function getStudentAssignmentDetail(
  studentId: string,
  admissionYear?: number,
  options: StudentAssignmentRequestOptions = {},
): Promise<AssignmentDetailResponse> {
  const normalizedStudentId = studentId.trim();
  if (!normalizedStudentId) {
    throw new StudentAssignmentApiError(
      400,
      "INVALID_QUERY",
      "studentId là bắt buộc.",
    );
  }
  const query = new URLSearchParams({ studentId: normalizedStudentId });
  if (admissionYear !== undefined)
    query.set("admissionYear", String(admissionYear));
  const payload = await request(
    `${resolveBaseUrl(options)}/api/method/${DETAIL_METHOD}?${query.toString()}`,
    { method: "GET", headers: await requestHeaders(options) },
  );
  try {
    return normalizeStudentAssignmentDetail(payload);
  } catch {
    throw new StudentAssignmentApiError(
      502,
      "INVALID_ASSIGNMENT_RESPONSE",
      "Phản hồi chi tiết phân công học sinh không hợp lệ.",
    );
  }
}

export async function runStudentAssignmentPipeline(
  params: RunStudentAssignmentPipelineRequest = {},
  options: StudentAssignmentRequestOptions = {},
): Promise<RunStudentAssignmentPipelineResponse> {
  const headers = await requestHeaders(options, true);
  const payload = await request(
    `${resolveBaseUrl(options)}/api/method/${RUN_PIPELINE_METHOD}`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...(params.admissionYear !== undefined
          ? { admissionYear: params.admissionYear }
          : {}),
        timezone: params.timezone ?? DEFAULT_TIMEZONE,
        limit: params.limit ?? 50,
      }),
    },
  );
  try {
    return normalizeRunStudentAssignmentPipeline(payload);
  } catch {
    throw new StudentAssignmentApiError(
      502,
      "INVALID_ASSIGNMENT_RESPONSE",
      "Phản hồi chạy pipeline phân công học sinh không hợp lệ.",
    );
  }
}

export async function resolveStudentAssignment(
  requestBody: ResolveStudentAssignmentRequest,
  options: StudentAssignmentRequestOptions = {},
): Promise<ResolveStudentAssignmentResponse> {
  const idempotencyKey = requestBody.idempotencyKey.trim();
  if (!/^[A-Za-z0-9._:-]{8,140}$/.test(idempotencyKey)) {
    throw new StudentAssignmentApiError(
      400,
      "INVALID_PAYLOAD",
      "Idempotency-Key không hợp lệ.",
    );
  }
  const headers = await requestHeaders(options, true);
  headers["Idempotency-Key"] = idempotencyKey;
  const payload = await request(
    `${resolveBaseUrl(options)}/api/method/${RESOLVE_METHOD}`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        studentId: requestBody.studentId,
        ownerId: requestBody.ownerId,
        region: requestBody.region,
        reason: requestBody.reason,
        expectedRevision: requestBody.expectedRevision,
      }),
    },
  );
  try {
    return normalizeResolvedStudentAssignment(payload);
  } catch {
    throw new StudentAssignmentApiError(
      502,
      "INVALID_ASSIGNMENT_RESPONSE",
      "Phản hồi xử lý phân công học sinh không hợp lệ.",
    );
  }
}
