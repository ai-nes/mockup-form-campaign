import type {
  AdmissionsPipeline,
  AdmissionsTrend,
  DirectorBriefing,
  DirectorKpi,
  DirectorOverviewParams,
  DirectorOverviewResponse,
  EnrollmentForecast,
  MarketOverviewItem,
  PipelineStage,
  SourcePerformance,
  TrendRange,
  WeeklyActivity,
} from "./types";

export const initialDirectorKpis: DirectorKpi[] = [];

export const initialEnrollmentForecast: EnrollmentForecast = {
  summary: {
    actual: 0,
    forecast: 0,
    target: 0,
    confidence: 0,
    gapToTarget: 0,
  },
  points: [],
};

export const initialDirectorBriefing: DirectorBriefing = {
  alert: {
    id: "",
    type: "risk",
    title: "",
    description: "",
    evidence: "",
    metric: "",
    href: "",
  },
  priorityAction: {
    id: "",
    title: "",
    description: "",
    impact: "",
    href: "",
  },
};

export const initialPipelineStages: PipelineStage[] = [];

export const initialAdmissionsTrend: AdmissionsTrend = {
  defaultRange: "30d",
  ranges: {
    "7d": { points: [], totals: { newLeads: 0, applicants: 0, enrolled: 0 } },
    "30d": { points: [], totals: { newLeads: 0, applicants: 0, enrolled: 0 } },
    year: { points: [], totals: { newLeads: 0, applicants: 0, enrolled: 0 } },
  },
};

export const initialMarketOverview: MarketOverviewItem[] = [];

export const initialSourcePerformance: SourcePerformance[] = [];

export const initialWeeklyActivity: WeeklyActivity = {
  points: [],
  totalInteractions: 0,
  averageSla: 0,
  changePercent: 0,
};

function computePipeline(): AdmissionsPipeline {
  const stages = initialPipelineStages;

  return {
    stages,
    summary: {
      prospects: 0,
      accepted: 0,
      enrolled: 0,
      enrollmentRate: 0,
    },
    biggestDrop: {
      fromStageId: "",
      fromLabel: "",
      toStageId: "",
      toLabel: "",
      differencePoints: 0,
    },
  };
}

export function computeDirectorOverview(params?: DirectorOverviewParams): DirectorOverviewResponse {
  const admissionYear = params?.admissionYear ?? 2026;
  const scope = params?.scope ?? "all";
  const trendRange: TrendRange = params?.trendRange ?? "30d";

  const scopeLabels: Record<string, string> = {
    all: "Toàn bộ cơ sở",
    north: "Cơ sở Miền Bắc",
    south: "Cơ sở Miền Nam",
    central: "Cơ sở Miền Trung",
  };

  const scopeLabel = scopeLabels[scope] ?? `Cơ sở ${scope}`;

  return {
    meta: {
      admissionYear,
      scope,
      scopeLabel,
      asOf: "",
      freshnessLabel: "",
      timezone: "Asia/Ho_Chi_Minh",
    },
    kpis: initialDirectorKpis,
    forecast: initialEnrollmentForecast,
    briefing: initialDirectorBriefing,
    pipeline: computePipeline(),
    admissionsTrend: {
      ...initialAdmissionsTrend,
      defaultRange: trendRange,
    },
    marketOverview: initialMarketOverview,
    sourcePerformance: initialSourcePerformance,
    weeklyActivity: initialWeeklyActivity,
  };
}
