export type Granularity = "monthly" | "yearly";

export interface RevenueDataPoint {
  id: string;
  period_start: string; // ISO 8601
  period_end: string; // ISO 8601
  label: string; // Display label ("Jan", "Feb", "2023", ...)
  revenue: {
    value: number;
    currency_code: string;
  };
  mrr: {
    value: number;
    currency_code: string;
  };
}

export interface RevenueOverviewRawResponse {
  chart_id: string;
  organization_id: string;
  generated_at: string;
  timezone: string;
  granularity: Granularity;
  currency: string;
  data: RevenueDataPoint[];
  summary: {
    total_revenue: number;
    revenue_delta_percent: number;
    current_mrr: number;
    mrr_delta_percent: number;
  };
}

export interface CustomerGrowthDataPoint {
  id: string;
  period_start: string;
  period_end: string;
  label: string;
  new_subscribers: number;
  churned_subscribers: number;
  total_subscribers: number;
}

export interface CustomerGrowthRawResponse {
  chart_id: string;
  organization_id: string;
  generated_at: string;
  timezone: string;
  granularity: Granularity;
  data: CustomerGrowthDataPoint[];
  summary: {
    total_subscribers: number;
    subscriber_delta_percent: number;
    net_new_subscribers: number;
  };
}

export type PlanKey = "free" | "basic" | "pro" | "enterprise";

export interface PlanMixRawItem {
  id: string;
  plan_key: PlanKey;
  plan_name: string;
  subscriber_count: number;
  percentage: number;
  mrr_amount: number;
  mrr_currency: string;
}

export interface PlanMixRawResponse {
  snapshot_id: string;
  generated_at: string;
  timezone: string;
  currency: string;
  total_subscribers: number;
  plans: PlanMixRawItem[];
}

export type SignupStatus = "active" | "trialing" | "past_due" | "canceled";

export interface RecentSignupRawItem {
  id: string;
  rep_name: string;
  email: string;
  plan_key: PlanKey;
  status: SignupStatus;
  mrr_amount: number;
  mrr_currency: string;
  joined_at: string; // ISO 8601
}

export interface RecentSignupsRawResponse {
  resource: "recent_signups_list";
  generated_at: string;
  data: RecentSignupRawItem[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    has_more: boolean;
  };
}

export type ActivityType =
  | "new_signup"
  | "upgrade"
  | "downgrade"
  | "cancellation"
  | "payment_failed"
  | "trial_started";

export interface RecentActivityRawItem {
  id: string;
  actor_name: string;
  activity_type: ActivityType;
  description: string;
  created_at: string; // ISO 8601
}

export interface RecentActivitiesRawResponse {
  resource: "recent_activities_list";
  generated_at: string;
  data: RecentActivityRawItem[];
}
