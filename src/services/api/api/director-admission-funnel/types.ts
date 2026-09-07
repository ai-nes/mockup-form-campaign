export const FUNNEL_STAGE_IDS = [
  "prospect",
  "engaged",
  "qualified",
  "counselling",
  "application",
  "accepted",
  "enrolled",
] as const;

export type FunnelStageId = (typeof FUNNEL_STAGE_IDS)[number];
export type FunnelAgingStageId = Exclude<FunnelStageId, "enrolled">;
export type FunnelMetaStatus = "available" | "partial";
export type FunnelPriorityTone = "error" | "warning" | "success";

export type FunnelMeta = {
  admissionYear: number;
  scope: string;
  scopeLabel: string;
  asOf: string;
  timezone: string;
  status: FunnelMetaStatus;
  warnings?: string[];
};

export type FunnelSummary = {
  prospects: number;
  enrolled: number;
  enrollmentRate: number | null;
  priorityStageId: FunnelStageId | null;
  priorityNextStageId: FunnelStageId | null;
  priorityDropRate: number | null;
  priorityDropCount: number | null;
};

export type FunnelStage = {
  id: FunnelStageId;
  label: string;
  description: string;
  count: number;
  remainingRate: number;
  stepRate: number | null;
};

export type FunnelDropOff = {
  fromStageId: FunnelStageId;
  toStageId: FunnelStageId;
  fromLabel: string;
  toLabel: string;
  dropCount: number;
  dropRate: number;
};

export type FunnelAgingRow = {
  stageId: FunnelAgingStageId;
  stage: string;
  underThreeDays: number;
  threeToSevenDays: number;
  sevenToFourteenDays: number;
  overFourteenDays: number;
  medianDays: number | null;
};

export type FunnelAging = {
  totalOverFourteenDays: number;
  rows: FunnelAgingRow[];
};

export type FunnelSourcePerformance = {
  id: string;
  label: string;
  stepRates: Array<number | null>;
  finalRate: number | null;
};

export type FunnelCohortRow = {
  id: string;
  label: string;
  values: Array<number | null>;
};

export type FunnelCohorts = {
  targetStageId: FunnelStageId;
  followUpWeeks: number[];
  completeCohortCount: number;
  rows: FunnelCohortRow[];
};

export type FunnelPriorityAction = {
  id: string;
  title: string;
  detail: string;
  tone: FunnelPriorityTone;
  href?: string;
};

export type DirectorAdmissionFunnelData = {
  meta: FunnelMeta;
  summary: FunnelSummary;
  stages: FunnelStage[];
  dropOffs: FunnelDropOff[];
  aging: FunnelAging;
  sourcePerformance: FunnelSourcePerformance[];
  cohorts: FunnelCohorts;
  priorityActions: FunnelPriorityAction[];
};

export type DirectorAdmissionFunnelResponse = DirectorAdmissionFunnelData;

export type DirectorAdmissionFunnelParams = {
  admissionYear?: number;
  scope?: string;
};
