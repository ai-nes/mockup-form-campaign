import type {
  AiAgentsRawResponse,
  AiCostAnalyticsRawResponse,
  AiProviderDistributionRawResponse,
  RecentActivitiesRawResponse,
  TopUsageRawResponse,
  WeeklyAiActivityRawResponse,
} from "./types";

const emptyAiCostAnalyticsRawData: Omit<AiCostAnalyticsRawResponse, "granularity"> = {
  dashboard_id: "",
  generated_at: "",
  timezone: "",
  metrics: [],
};

export const aiCostAnalyticsMonthlyRawData: AiCostAnalyticsRawResponse = {
  ...emptyAiCostAnalyticsRawData,
  granularity: "monthly",
};
export const aiCostAnalyticsYearlyRawData: AiCostAnalyticsRawResponse = {
  ...emptyAiCostAnalyticsRawData,
  granularity: "yearly",
};

export const weeklyAiActivityRawData: WeeklyAiActivityRawResponse = {
  chart_id: "",
  generated_at: "",
  timezone: "",
  data: [],
  summary: {
    total_requests: 0,
    requests_delta_percent: 0,
  },
};

export const topUsageRawData: TopUsageRawResponse = {
  dashboard_id: "",
  generated_at: "",
  timezone: "",
  models: [],
};

export const aiAgentsRawData: AiAgentsRawResponse = {
  dashboard_id: "",
  generated_at: "",
  timezone: "",
  agents: [],
};

export const recentActivitiesRawData: RecentActivitiesRawResponse = {
  resource: "ai_activity_list",
  generated_at: "",
  data: [],
};

export const aiProviderDistributionRawData: AiProviderDistributionRawResponse = {
  chart_id: "",
  generated_at: "",
  timezone: "",
  total_requests: 0,
  segments: [],
};
