export type AiGranularity = "monthly" | "yearly";

export type AiCostStatKey =
  | "total_spend"
  | "api_requests"
  | "avg_cost_per_request"
  | "tokens_processed";

export interface AiCostMetric {
  id: string;
  metric_key: AiCostStatKey;
  current_value: number;
  previous_value: number | null;
  delta_percent: number;
  trend: "up" | "down";
  currency_code: "USD" | null;
  display_format: "currency_compact" | "currency_precise" | "integer" | "compact";
  created_at: string;
  updated_at: string;
}

export interface AiCostAnalyticsRawResponse {
  dashboard_id: string;
  generated_at: string;
  timezone: string;
  granularity: AiGranularity;
  metrics: AiCostMetric[];
}

export interface WeeklyAiActivityPoint {
  id: string;
  day_label: string;
  date: string; // ISO 8601
  requests: number;
  tokens_in_thousands: number;
}

export interface WeeklyAiActivityRawResponse {
  chart_id: string;
  generated_at: string;
  timezone: string;
  data: WeeklyAiActivityPoint[];
  summary: {
    total_requests: number;
    requests_delta_percent: number;
  };
}

export interface TopUsageModelRawItem {
  id: string;
  model_name: string;
  provider: string;
  requests_count: number;
  cost_amount: number;
  cost_currency: string;
  rank: number;
}

export interface TopUsageRawResponse {
  dashboard_id: string;
  generated_at: string;
  timezone: string;
  models: TopUsageModelRawItem[];
}

export type AiAgentStatus = "active" | "idle" | "error";

export interface AiAgentRawItem {
  id: string;
  agent_name: string;
  description: string;
  status: AiAgentStatus;
  requests_count: number;
  success_rate: number;
  avg_response_time_ms: number;
  created_at: string;
  updated_at: string;
}

export interface AiAgentsRawResponse {
  dashboard_id: string;
  generated_at: string;
  timezone: string;
  agents: AiAgentRawItem[];
}

export type ActivityType =
  | "agent_run"
  | "alert"
  | "deployment"
  | "usage_spike"
  | "integration";

export interface RecentActivityRawItem {
  id: string;
  activity_type: ActivityType;
  title: string;
  description: string;
  actor_name: string;
  created_at: string; // ISO 8601
}

export interface RecentActivitiesRawResponse {
  resource: "ai_activity_list";
  generated_at: string;
  data: RecentActivityRawItem[];
}

export interface ProviderDistributionSegmentRaw {
  id: string;
  provider_name: string;
  percentage: number;
  color_token: string;
}

export interface AiProviderDistributionRawResponse {
  chart_id: string;
  generated_at: string;
  timezone: string;
  total_requests: number;
  segments: ProviderDistributionSegmentRaw[];
}
