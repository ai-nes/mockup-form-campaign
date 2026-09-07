import type {
  CustomerGrowthRawResponse,
  PlanMixRawResponse,
  RecentActivitiesRawResponse,
  RecentSignupsRawResponse,
  RevenueOverviewRawResponse,
} from "./types";

const emptyRevenueOverviewRawData: Omit<RevenueOverviewRawResponse, "granularity"> = {
  chart_id: "",
  organization_id: "",
  generated_at: "",
  timezone: "",
  currency: "",
  data: [],
  summary: {
    total_revenue: 0,
    revenue_delta_percent: 0,
    current_mrr: 0,
    mrr_delta_percent: 0,
  },
};

export const revenueOverviewMonthlyRawData: RevenueOverviewRawResponse = {
  ...emptyRevenueOverviewRawData,
  granularity: "monthly",
};
export const revenueOverviewYearlyRawData: RevenueOverviewRawResponse = {
  ...emptyRevenueOverviewRawData,
  granularity: "yearly",
};

const emptyCustomerGrowthRawData: Omit<CustomerGrowthRawResponse, "granularity"> = {
  chart_id: "",
  organization_id: "",
  generated_at: "",
  timezone: "",
  data: [],
  summary: {
    total_subscribers: 0,
    subscriber_delta_percent: 0,
    net_new_subscribers: 0,
  },
};

export const customerGrowthMonthlyRawData: CustomerGrowthRawResponse = {
  ...emptyCustomerGrowthRawData,
  granularity: "monthly",
};
export const customerGrowthYearlyRawData: CustomerGrowthRawResponse = {
  ...emptyCustomerGrowthRawData,
  granularity: "yearly",
};

export const planMixRawData: PlanMixRawResponse = {
  snapshot_id: "",
  generated_at: "",
  timezone: "",
  currency: "",
  total_subscribers: 0,
  plans: [],
};

export const recentSignupsRawData: RecentSignupsRawResponse = {
  resource: "recent_signups_list",
  generated_at: "",
  data: [],
  meta: {
    total: 0,
    page: 1,
    page_size: 0,
    has_more: false,
  },
};

export const recentActivitiesRawData: RecentActivitiesRawResponse = {
  resource: "recent_activities_list",
  generated_at: "",
  data: [],
};
