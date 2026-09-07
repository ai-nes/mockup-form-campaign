export type MetricTone = "primary" | "success" | "warning" | "danger" | "info";

export type OverviewMeta = {
  admissionYear: number;
  scope: string;
  scopeLabel: string;
  asOf: string;
  freshnessLabel?: string;
  timezone?: string;
};

export type DirectorKpi = {
  id: string;
  label: string;
  value: string;
  target: string;
  achievement: string;
  change: string;
  helper: string;
  tone: MetricTone;
};

export type ForecastSummary = {
  actual: number;
  forecast: number;
  target: number;
  confidence: number;
  gapToTarget: number;
};

export type ForecastPoint = {
  label: string;
  actual: number | null;
  forecast: number;
  target: number;
};

export type EnrollmentForecast = {
  summary: ForecastSummary;
  points: ForecastPoint[];
};

export type BriefingAlert = {
  id: string;
  type: "risk" | "opportunity" | "revenue";
  title: string;
  description: string;
  evidence: string;
  metric: string;
  href: string;
};

export type BriefingPriorityAction = {
  id: string;
  title: string;
  description: string;
  impact: string;
  href: string;
};

export type DirectorBriefing = {
  alert: BriefingAlert;
  priorityAction: BriefingPriorityAction;
};

export type PipelineStage = {
  id: string;
  label: string;
  value: string;
  percentage: number;
  conversion: string;
  barClassName?: string;
};

export type PipelineSummary = {
  prospects: number;
  accepted: number;
  enrolled: number;
  enrollmentRate: number;
};

export type PipelineBiggestDrop = {
  fromStageId: string;
  fromLabel: string;
  toStageId: string;
  toLabel: string;
  differencePoints: number;
};

export type AdmissionsPipeline = {
  stages: PipelineStage[];
  summary: PipelineSummary;
  biggestDrop: PipelineBiggestDrop;
};

export type TrendRange = "7d" | "30d" | "year";

export type AdmissionsTrendPoint = {
  label: string;
  newLeads: number;
  applicants: number;
  enrolled: number;
};

export type AdmissionsTrendTotals = {
  newLeads: number;
  applicants: number;
  enrolled: number;
};

export type AdmissionsTrendRangeData = {
  points: AdmissionsTrendPoint[];
  totals: AdmissionsTrendTotals;
};

export type AdmissionsTrend = {
  defaultRange: TrendRange;
  ranges: Record<TrendRange, AdmissionsTrendRangeData>;
};

export type MarketOverviewItem = {
  id: string;
  name: string;
  prospects: string;
  enrolled: string;
  conversion: string;
  growth: string;
  coverage: number;
  tone: MetricTone;
};

export type SourcePerformance = {
  id: string;
  label: string;
  leads: string;
  applicants: string;
  enrolled: string;
  share: number;
  barClassName?: string;
  chartColor?: string;
};

export type WeeklyActivityPoint = {
  label: string;
  interactions: number;
  sla: number;
};

export type ActivityPoint = WeeklyActivityPoint;

export type WeeklyActivity = {
  points: WeeklyActivityPoint[];
  totalInteractions: number;
  averageSla: number;
  changePercent: number;
};

export type DirectorOverviewData = {
  meta: OverviewMeta;
  kpis: DirectorKpi[];
  forecast: EnrollmentForecast;
  briefing: DirectorBriefing;
  pipeline: AdmissionsPipeline;
  admissionsTrend: AdmissionsTrend;
  marketOverview: MarketOverviewItem[];
  sourcePerformance: SourcePerformance[];
  weeklyActivity: WeeklyActivity;
};

export type DirectorOverviewResponse = DirectorOverviewData;

export type DirectorOverviewParams = {
  admissionYear?: number;
  scope?: string;
  trendRange?: TrendRange;
};

export type DirectorOverviewError = {
  code: string;
  message: string;
};
