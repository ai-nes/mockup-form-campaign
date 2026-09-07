export type NbaDisposition = "RECOMMEND" | "WAIT" | "NO_ACTION" | "ABSTAIN";

export type NbaRecommendationPriority = "high" | "medium" | "low";

export type NbaDecisionOperation =
  | "ACCEPT"
  | "ACCEPT_WITH_CHANGES"
  | "REJECT"
  | "DEFER"
  | "DISMISS";

export interface NbaExplanationAction {
  code: string;
  title: string;
}

export interface NbaRecommendationTarget {
  type: string;
  id: string;
}

export interface NbaRecommendationAction {
  code: string;
  title: string;
}

export interface NbaRecommendationTiming {
  scheduledAt: string | null;
  expiresAt: string | null;
  timezone: string | null;
}

export interface NbaRecommendationStatus {
  lifecycle: string;
  decision: string;
  execution: string;
}

export interface NbaExplanationEvidence {
  summary: string;
  evidence_ref: string;
}

export interface NbaExplanationTiming {
  recommended_at: string;
  reason: string;
}

export interface NbaExplanation {
  action: NbaExplanationAction;
  summary: string;
  why_action: string;
  why_now: string;
  evidence: NbaExplanationEvidence[];
  uncertainty: string;
  timing: NbaExplanationTiming;
}

export interface NbaEvaluationReference {
  id: string;
  disposition: NbaDisposition;
  status: string;
}

/**
 * The kernel owns aiPayload. Keep it open-ended because its shape is only
 * stable within an engine revision and is not part of the FE contract.
 */
export interface NbaRecommendation {
  id: string;
  target: NbaRecommendationTarget;
  action: NbaRecommendationAction;
  rank: number;
  recommendationKey: string;
  studentId: string;
  studentName: string | null;
  actionId: string;
  priority: NbaRecommendationPriority;
  channel: string | null;
  reason: string;
  objective: string | null;
  context: string[];
  timing: NbaRecommendationTiming;
  status: NbaRecommendationStatus;
  aiPayload: Record<string, unknown>;
  explanation: NbaExplanation | null;
  explanationSource: "model" | null;
  evaluation: NbaEvaluationReference;
  generatedAt: string;
  expectedRevision: string | null;
  revision: string | null;
  permittedDecisions: string[];
}

export interface StudentNbaWorklistResponse {
  items: NbaRecommendation[];
  nextCursor: string | null;
  policyVersion: string | null;
}

export interface NbaEvaluationRunResponse {
  evaluation: string;
  studentId: string;
  status: string;
  disposition: NbaDisposition | null;
  recommendationCount: number;
  terminalReason: string | null;
  recommendations: NbaRecommendation[];
}

export type DirectorNbaRecommendationsStatus = "available" | "empty";

export interface DirectorNbaRecommendationsMeta {
  admissionYear: number;
  asOf: string;
  timezone: string;
  status: DirectorNbaRecommendationsStatus;
  count: number;
  limit: number;
  metricKind: "observational";
  metricDisclaimer: string;
}

/**
 * Director recommendation rows are read-only. Decision fields such as
 * expected_revision are intentionally not required here; the per-student
 * worklist is the authority for accept/reject/defer operations.
 */
export interface DirectorNbaRecommendation extends Omit<
  NbaRecommendation,
  "reason"
> {
  reason: string | null;
}

export interface DirectorNbaRecommendationsResponse {
  meta: DirectorNbaRecommendationsMeta;
  recommendations: DirectorNbaRecommendation[];
}

export interface DirectorNbaRecommendationsParams {
  admissionYear?: number;
  limit?: number;
}

export interface NbaDecisionRequest {
  name: string;
  expectedRevision: string;
  operation: NbaDecisionOperation;
  idempotencyKey: string;
  delta?: {
    due_at?: string;
    revisit_at?: string;
    assignee_staff?: string;
    channel?: string;
    priority?: NbaRecommendationPriority;
  };
  decisionReason?: string;
  revisitAt?: string;
  correlationId?: string;
}

export interface NbaDecisionResponse {
  status: "accepted" | "rejected" | "deferred" | "dismissed";
  operation: NbaDecisionOperation;
  recommendation: string;
  action: string | null;
  event: string | null;
  receipt: string | null;
}

export interface NbaApiRequestOptions {
  baseUrl?: string;
}
