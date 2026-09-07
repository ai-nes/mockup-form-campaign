export type SaleTrendRange = "4w" | "12w";
export type SaleOverviewStatus = "available" | "partial" | "unavailable";
export type SaleKpiId =
  | "assigned"
  | "consulting"
  | "qualified"
  | "documents"
  | "admission";

export interface SaleOverviewMeta {
  viewer: { id: string; displayName: string };
  admissionYear: number;
  date: string;
  asOf: string;
  timezone: string;
  status: SaleOverviewStatus;
  warnings: string[];
}

export interface SaleKpi {
  id: SaleKpiId;
  value: number;
}

export type SaleTaskType = "call" | "document" | "message" | "other";
export type SaleTaskPriority = "Low" | "Medium" | "High";
export type SaleTaskStatus =
  | "Backlog"
  | "Todo"
  | "In Progress"
  | "Done"
  | "Canceled";

export interface SaleTask {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  type: SaleTaskType;
  startAt: string | null;
  dueAt: string | null;
  context: string | null;
  priority: SaleTaskPriority;
  status: SaleTaskStatus;
  isOverdue: boolean;
}

export interface SaleTasks {
  priority: { overdueCount: number; items: SaleTask[] };
  summary: {
    today: { total: number; pending: number; completed: number };
    overdue: { count: number };
    upcoming: { count: number; horizonDays: number };
  };
}

export type SalePipelineStageId =
  | "assigned"
  | "contacted"
  | "consulted"
  | "interested"
  | "documents"
  | "confirmed"
  | "admitted";

export interface SalePipelineStage {
  id: SalePipelineStageId;
  label: string;
  count: number;
}

export type SaleAttentionId = "at-risk" | "high-intent" | "blocked";

export interface SaleAttentionItem {
  id: SaleAttentionId;
  count: number;
}

export interface SaleConversionTrendPoint {
  label: string;
  periodStart: string;
  periodEnd: string;
  consulted: number;
  admitted: number;
}

export interface SaleConversionTrendRange {
  from: string;
  to: string;
  points: SaleConversionTrendPoint[];
}

export interface SaleConversionTrend {
  defaultRange: SaleTrendRange;
  ranges: Record<SaleTrendRange, SaleConversionTrendRange>;
}

export type SaleStudentStatusId =
  | "new"
  | "consulting"
  | "waiting"
  | "documents"
  | "admission";

export interface SaleStudentStatusItem {
  id: SaleStudentStatusId;
  label: string;
  count: number;
  share: number | null;
}

export interface SaleStudentStatus {
  total: number;
  items: SaleStudentStatusItem[];
}

export type SaleOperationId = "overdue-tasks" | "missing-documents";

export interface SaleOperations {
  total: number;
  items: Array<{ id: SaleOperationId; count: number }>;
}

export interface SaleOverviewResponse {
  meta: SaleOverviewMeta;
  kpis: SaleKpi[];
  tasks: SaleTasks;
  pipeline: { stages: SalePipelineStage[] };
  attention: { items: SaleAttentionItem[] };
  conversionTrend: SaleConversionTrend;
  studentStatus: SaleStudentStatus;
  operations: SaleOperations;
}

export interface SaleOverviewParams {
  admissionYear?: number;
  date?: string;
  trendRange?: SaleTrendRange;
  timezone?: string;
  priorityLimit?: number;
}
