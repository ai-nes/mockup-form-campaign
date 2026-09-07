export type HealthTone = "good" | "watch" | "critical";

export type CapabilityKey =
  | "leadGeneration"
  | "counselling"
  | "quality"
  | "conversion"
  | "campaigns"
  | "productivity";

export type CapabilityColumn = { key: CapabilityKey; label: string };
export type FunnelStage = { id: string; stage: string; value: number };
export type MonthlyTrend = {
  month: string;
  applications: number | null;
  enrollments: number | null;
  previousApplications: number | null;
};
export type RegionPerformance = {
  id: string;
  name: string;
  applications: number;
  enrollments: number;
  enrollmentTarget: number;
  targetAchievement: number;
  conversion: number | null;
  applicationChange: number | null;
  enrollmentChange: number | null;
  activeAdvisors: number | null;
  capacity: number | null;
  health: HealthTone;
  trend: MonthlyTrend[];
  funnel: FunnelStage[];
  capabilities: Record<CapabilityKey, HealthTone>;
};
export type PriorityAction = {
  id: string;
  title: string;
  detail: string;
  provinceId: string | "all";
  priority: "Cao" | "Trung bình" | "Thấp";
  tone: HealthTone;
};
export type RegionalPerformanceData = {
  meta: {
    admissionYear: number;
    scope: string;
    scopeLabel: string;
    asOf: string;
    timezone: string;
    status: "available" | "partial";
    trendMonths: number;
    warnings: string[];
  };
  capabilityColumns: CapabilityColumn[];
  provinces: RegionPerformance[];
  priorityActions: PriorityAction[];
};
export type DirectorRegionalPerformanceParams = {
  admissionYear?: number;
  scope?: string;
};
