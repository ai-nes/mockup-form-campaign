export type LeadSaleOverviewStatus = "available" | "partial" | "unavailable";
export type LeadSaleTrendRange = "4w" | "3m";

export interface LeadSaleOverviewMeta {
  viewer: { id: string; displayName: string };
  team: { id: string; name: string };
  admissionYear: number;
  date: string;
  asOf: string;
  timezone: string;
  status: LeadSaleOverviewStatus;
  warnings: string[];
}

export type LeadSaleKpiId =
  | "active"
  | "new"
  | "unassigned"
  | "needs-action"
  | "overdue"
  | "documents";

export interface LeadSaleKpi {
  id: LeadSaleKpiId;
  value: number;
}

export type LeadSaleInterventionId =
  | "unassigned"
  | "not-contacted"
  | "at-risk"
  | "blocked";

export interface LeadSaleIntervention {
  id: LeadSaleInterventionId;
  count: number;
}

export type LeadSaleTeamMemberStatus = "on-track" | "needs-support";

export interface LeadSaleTeamMember {
  id: string;
  displayName: string;
  activeStudents: number;
  consulted: number;
  admitted: number;
  status: LeadSaleTeamMemberStatus;
}

export type LeadSaleStudentStatusId =
  | "consulting"
  | "waiting"
  | "documents"
  | "admission"
  | "new";

export interface LeadSaleStudentStatusItem {
  id: LeadSaleStudentStatusId;
  label: string;
  count: number;
  share: number | null;
}

export interface LeadSaleStudentStatus {
  total: number;
  items: LeadSaleStudentStatusItem[];
}

export interface LeadSaleTrendPoint {
  label: string;
  periodStart: string;
  periodEnd: string;
  consulted: number;
  admitted: number;
}

export interface LeadSaleTrendRangeData {
  from: string;
  to: string;
  points: LeadSaleTrendPoint[];
}

export interface LeadSaleResultTrend {
  defaultRange: LeadSaleTrendRange;
  ranges: Record<LeadSaleTrendRange, LeadSaleTrendRangeData>;
}

export interface LeadSaleOverviewResponse {
  meta: LeadSaleOverviewMeta;
  kpis: LeadSaleKpi[];
  interventions: { items: LeadSaleIntervention[] };
  teamPerformance: { items: LeadSaleTeamMember[] };
  studentStatus: LeadSaleStudentStatus;
  resultTrend: LeadSaleResultTrend;
}

export interface LeadSaleOverviewParams {
  admissionYear?: number;
  date?: string;
  trendRange?: LeadSaleTrendRange;
  timezone?: string;
  teamMemberLimit?: number;
}
