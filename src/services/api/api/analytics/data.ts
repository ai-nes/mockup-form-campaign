import type {
  TopChannelsRawResponse,
  TopContentRawResponse,
  TopCountriesRawResponse,
  UsedDevicesRawResponse,
  VisitorsAnalyticsRawResponse,
} from "./types";

const emptyVisitorsAnalyticsRawData: Omit<VisitorsAnalyticsRawResponse, "granularity"> = {
  chart_id: "",
  organization_id: "",
  generated_at: "",
  timezone: "",
  data: [],
  summary: {
    total_visitors: 0,
    total_unique_visitors: 0,
    visitors_delta_percent: 0,
    unique_visitors_delta_percent: 0,
  },
};

export const visitorsAnalyticsWeeklyRawData: VisitorsAnalyticsRawResponse = {
  ...emptyVisitorsAnalyticsRawData,
  granularity: "weekly",
};
export const visitorsAnalyticsMonthlyRawData: VisitorsAnalyticsRawResponse = {
  ...emptyVisitorsAnalyticsRawData,
  granularity: "monthly",
};

export const usedDevicesRawData: UsedDevicesRawResponse = {
  dashboard_id: "",
  generated_at: "",
  timezone: "",
  total_sessions: 0,
  devices: [],
};

export const topCountriesRawData: TopCountriesRawResponse = {
  dashboard_id: "",
  generated_at: "",
  timezone: "",
  countries: [],
};

export const topContentRawData: TopContentRawResponse = {
  dashboard_id: "",
  generated_at: "",
  timezone: "",
  pages: [],
};

export const topChannelsRawData: TopChannelsRawResponse = {
  dashboard_id: "",
  generated_at: "",
  timezone: "",
  channels: [],
};
