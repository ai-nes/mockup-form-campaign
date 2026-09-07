import type { ActionTimeSlot } from "@/services/api/nba-actions";

export type ActionChannel = "NONE" | "CALL" | "EMAIL" | "MESSAGE";
export type RuleStatus = "draft" | "published" | "archived";
export type RulePriority = "high" | "medium" | "low";
export type RuleTriggerType = "event" | "state" | "inactivity" | "deadline" | "manual";
export type TimingTriggerType = "event" | "relative" | "deadline" | "schedule";
export type DelayUnit = "minutes" | "hours" | "days";
export type DeadlineType = "none" | "fixed_offset" | "business_days";
export type RecurrenceType = "none" | "daily" | "weekly" | "monthly";

export interface NbaAdminActionType {
  name: string;
  actionType: string;
  displayName: string;
  enabled: boolean;
  sortOrder: number;
  modified: string | null;
}

export interface ListActionTypesParams {
  enabled?: boolean;
  search?: string;
  start?: number;
  pageLength?: number;
}

export interface ListActionTypesResponse {
  total: number;
  start: number;
  pageLength: number;
  actionTypes: NbaAdminActionType[];
}

export interface UpdateActionTypePayload {
  name: string;
  displayName?: string;
  enabled?: boolean;
  sortOrder?: number;
}

export interface CreateActionTypePayload {
  actionType: string;
  displayName: string;
  enabled: boolean;
  sortOrder: number;
}

export interface NbaTimingPolicy {
  name: string;
  policyKey: string;
  triggerType: TimingTriggerType;
  triggerEvent: string | null;
  delayValue: number;
  delayUnit: DelayUnit;
  timeSlot: ActionTimeSlot | null;
  allowedStartTime: string | null;
  allowedEndTime: string | null;
  deadlineType: DeadlineType;
  deadlineOffset: number;
  recurrenceType: RecurrenceType;
  recurrenceInterval: number;
  stopCondition: string | null;
  optimizationEnabled: boolean;
  optimizationObjective: string | null;
  modified: string | null;
}

export interface TimingPolicyPayload {
  policyKey?: string;
  triggerType: TimingTriggerType;
  triggerEvent?: string;
  delayValue?: number;
  delayUnit?: DelayUnit;
  timeSlot?: ActionTimeSlot | null;
  allowedStartTime?: string;
  allowedEndTime?: string;
  deadlineType?: DeadlineType;
  deadlineOffset?: number;
  recurrenceType?: RecurrenceType;
  recurrenceInterval?: number;
  stopCondition?: string;
  optimizationEnabled?: boolean;
  optimizationObjective?: string;
}

export interface ListTimingPoliciesParams {
  start?: number;
  pageLength?: number;
}

export interface ListTimingPoliciesResponse {
  total: number;
  start: number;
  pageLength: number;
  policies: NbaTimingPolicy[];
}

export interface RuleCondition {
  field: string;
  operator: string;
  value?: string | number | boolean | string[] | null;
}

export interface RuleConditions {
  all: RuleCondition[];
  any: RuleCondition[];
}

export interface NbaRecommendationRule {
  name: string;
  ruleKey: string;
  displayName: string;
  description: string | null;
  status: RuleStatus;
  enabled: boolean;
  version: number;
  actionCode: string;
  priority: RulePriority;
  triggerType: RuleTriggerType;
  triggerEvent: string | null;
  conditions: RuleConditions;
  timingPolicy: string | null;
  cooldownValue: number;
  cooldownUnit: DelayUnit;
  maxOccurrences: number;
  expiresAfterHours: number | null;
  stopConditions: string[];
  publishedAt: string | null;
  publishedBy: string | null;
  archiveReason: string | null;
  modified: string | null;
}

export interface ListRulesParams {
  status?: RuleStatus;
  enabled?: boolean;
  actionCode?: string;
  triggerType?: RuleTriggerType;
  search?: string;
  start?: number;
  pageLength?: number;
}

export interface ListRulesResponse {
  total: number;
  start: number;
  pageLength: number;
  rules: NbaRecommendationRule[];
}

export interface RecommendationRulePayload {
  ruleKey?: string;
  displayName?: string;
  description?: string;
  actionCode?: string;
  priority?: RulePriority;
  triggerType?: RuleTriggerType;
  triggerEvent?: string;
  conditions?: RuleConditions;
  timingPolicy?: string | null;
  cooldownValue?: number;
  cooldownUnit?: DelayUnit;
  maxOccurrences?: number;
  expiresAfterHours?: number | null;
  stopConditions?: string[];
}

export interface ConditionFieldMetadata {
  field: string;
  label: string;
  type: "text" | "number" | "select" | "link" | string;
  operators: string[];
  options?: string[];
  optionsDoctype?: string | null;
}

export interface RulePreviewResult {
  eligible: boolean;
  reasonCode?: string;
  reason?: string;
  action?: {
    code: string;
    displayName: string;
    channel: ActionChannel;
    executionType: string;
    available: boolean;
  };
  timing?: {
    policy: string | null;
    nextAt: string | null;
    expiresAt: string | null;
  };
  priority?: RulePriority;
  warnings: Array<{ code: string; message: string }>;
}

export interface RulePreviewPayload {
  rule: RecommendationRulePayload;
  context: {
    student: string;
    lifecycleStage?: string;
    ownerStaff?: string;
  };
}

export type RequestOptions = {
  baseUrl?: string;
  headers?: Record<string, string>;
};
