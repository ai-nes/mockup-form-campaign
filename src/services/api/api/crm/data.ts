import type {
  LeadGrowthRawResponse,
  LeadsReportRawResponse,
  RecentActivitiesRawResponse,
  UpcomingTasksRawResponse,
} from "./types";

const emptyLeadGrowthRawData: Omit<LeadGrowthRawResponse, "granularity"> = {
  chart_id: "",
  organization_id: "",
  generated_at: "",
  timezone: "",
  data: [],
  summary: {
    total_leads: 0,
    total_conversions: 0,
    leads_delta_percent: 0,
    conversion_rate_percent: 0,
    conversion_rate_delta_percent: 0,
  },
};

export const leadGrowthWeeklyRawData: LeadGrowthRawResponse = { ...emptyLeadGrowthRawData, granularity: "7d" };
export const leadGrowthMonthlyRawData: LeadGrowthRawResponse = { ...emptyLeadGrowthRawData, granularity: "30d" };
export const leadGrowthQuarterlyRawData: LeadGrowthRawResponse = { ...emptyLeadGrowthRawData, granularity: "90d" };

export const leadsReportRawData: LeadsReportRawResponse = {
  dashboard_id: "",
  generated_at: "",
  timezone: "",
  reps: [],
};

export const upcomingTasksRawData: UpcomingTasksRawResponse = {
  resource: "upcoming_tasks",
  generated_at: "",
  week_start: "",
  data: [],
};

export const recentActivitiesRawData: RecentActivitiesRawResponse = {
  resource: "activity_feed",
  generated_at: "",
  data: [],
  meta: {
    total: 0,
    has_more: false,
  },
};
