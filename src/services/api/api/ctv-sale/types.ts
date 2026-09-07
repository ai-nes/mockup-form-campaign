export type CtvSaleRange = "7d" | "30d";
export type CtvSaleOverviewStatus = "available" | "partial" | "unavailable";
export type CtvSaleKpiTone = "primary" | "info" | "warning" | "success";

export interface CtvSaleOverviewMeta {
  viewer: { id: string; displayName: string };
  date: string;
  asOf: string;
  timezone: string;
  status: CtvSaleOverviewStatus;
  warnings: string[];
}

export interface CtvSaleKpi {
  id: "assigned" | "uncontacted" | "follow-up" | "transfer";
  value: number;
  deltaValue: number | null;
  deltaUnit: "count" | "percent";
  comparisonPeriod: "previous-day" | "previous-week" | "current-week" | null;
  direction: "up" | "down" | "flat" | null;
  ratioOfAssigned: number | null;
  tone: CtvSaleKpiTone;
}

export type CtvSaleTaskType = "call" | "follow-up" | "message" | "other";
export type CtvSaleTaskPriority = "high" | "medium" | "low";
export type CtvSaleTaskStatus = "todo" | "in-progress" | "done" | "canceled";

export interface CtvSalePriorityTask {
  id: string;
  studentId: string;
  studentName: string;
  taskType: CtvSaleTaskType;
  taskTypeLabel: string;
  dueAt: string | null;
  detail: string;
  priority: CtvSaleTaskPriority;
  status: CtvSaleTaskStatus;
  isOverdue: boolean;
}

export interface CtvSaleTasks {
  priority: { overdueCount: number; items: CtvSalePriorityTask[] };
  summary: {
    today: { total: number; pending: number; completed: number };
    overdue: { count: number };
    upcoming: { count: number; horizonDays: number };
    completion: { completed: number; total: number; rate: number | null };
  };
}

export interface CtvSaleStudentStatusItem {
  id: "new" | "consulting" | "connected" | "transferred";
  label: string;
  count: number;
  share: number | null;
}

export interface CtvSaleStudentStatus {
  total: number;
  items: CtvSaleStudentStatusItem[];
}

export interface CtvSaleContactTrendPoint {
  label: string;
  periodStart: string;
  periodEnd: string;
  contacts: number;
  connected: number;
}

export interface CtvSaleContactTrendRange {
  from: string;
  to: string;
  points: CtvSaleContactTrendPoint[];
  totals: { contacts: number; connected: number };
}

export interface CtvSaleContactTrend {
  defaultRange: CtvSaleRange;
  ranges: Record<CtvSaleRange, CtvSaleContactTrendRange>;
}

export interface CtvSaleContactOutcomeItem {
  id: string;
  label: string;
  count: number;
  share: number | null;
}

export interface CtvSaleContactOutcomes {
  from: string;
  to: string;
  total: number;
  connectedRate: number | null;
  items: CtvSaleContactOutcomeItem[];
}

export interface CtvSaleOverviewResponse {
  meta: CtvSaleOverviewMeta;
  kpis: CtvSaleKpi[];
  tasks: CtvSaleTasks;
  studentStatus: CtvSaleStudentStatus;
  contacts: {
    trend: CtvSaleContactTrend;
    outcomes: CtvSaleContactOutcomes;
  };
}

export interface CtvSaleOverviewParams {
  date?: string;
  trendRange?: CtvSaleRange;
  outcomeRange?: CtvSaleRange;
  timezone?: string;
  ctvId?: string;
  priorityLimit?: number;
}
