export type MarketingTimeRange = "7d" | "30d" | "90d";

export type MarketingStatKey = "impressions" | "clicks" | "ctr" | "conversions";

export interface MarketingOverviewStatMetric {
  id: string;
  metric_key: MarketingStatKey;
  current_value: number;
  previous_value: number | null;
  delta_percent: number;
  trend: "up" | "down";
  display_format: "compact" | "percent" | "integer";
  period_label: MarketingTimeRange;
  created_at: string;
  updated_at: string;
}

export interface MarketingOverviewStatsRawResponse {
  dashboard_id: string;
  generated_at: string;
  timezone: string;
  period: MarketingTimeRange;
  metrics: MarketingOverviewStatMetric[];
}

export interface CampaignVisitorDataPoint {
  id: string;
  period_start: string;
  label: string;
  email: number;
  social: number;
  search: number;
  referral: number;
}

export interface CampaignVisitorsRawResponse {
  chart_id: string;
  organization_id: string;
  generated_at: string;
  timezone: string;
  period: MarketingTimeRange;
  data: CampaignVisitorDataPoint[];
  summary: {
    total_visitors: number;
    delta_percent: number;
  };
}

export interface AudienceSegmentRawItem {
  id: string;
  segment_label: string;
  visitor_count: number;
  percentage: number;
  created_at: string;
  updated_at: string;
}

export interface AudienceInsightsRawResponse {
  dashboard_id: string;
  generated_at: string;
  timezone: string;
  segments: AudienceSegmentRawItem[];
}

export type FunnelStageKey = "visitors" | "leads" | "opportunities" | "customers";

export interface FunnelStageRawItem {
  id: string;
  stage_key: FunnelStageKey;
  label: string;
  count: number;
  percent_of_top: number;
}

export interface ConversionFunnelRawResponse {
  funnel_id: string;
  generated_at: string;
  timezone: string;
  stages: FunnelStageRawItem[];
}

export interface ChannelPerformanceRawItem {
  id: string;
  channel_name: string;
  spend_amount: number;
  currency_code: string;
  click_count: number;
  conversion_rate: number;
  revenue_amount: number;
  created_at: string;
  updated_at: string;
}

export interface ChannelPerformanceRawResponse {
  dashboard_id: string;
  generated_at: string;
  timezone: string;
  channels: ChannelPerformanceRawItem[];
}

export type ActivityType =
  | "campaign_launched"
  | "campaign_paused"
  | "new_lead"
  | "budget_alert"
  | "comment"
  | "report_ready";

export interface RecentActivityRawItem {
  id: string;
  type: ActivityType;
  actor_name: string;
  description: string;
  created_at: string;
}

export interface RecentActivitiesRawResponse {
  dashboard_id: string;
  generated_at: string;
  activities: RecentActivityRawItem[];
}
