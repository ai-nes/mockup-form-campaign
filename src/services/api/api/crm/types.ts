export type LeadGrowthGranularity = "7d" | "30d" | "90d";

export interface LeadGrowthDataPoint {
  id: string;
  period_start: string; // ISO 8601
  period_end: string; // ISO 8601
  label: string; // Display label ("Mon", "Week 1", etc.)
  leads: { value: number };
  conversions: { value: number };
}

export interface LeadGrowthRawResponse {
  chart_id: string;
  organization_id: string;
  generated_at: string;
  timezone: string;
  granularity: LeadGrowthGranularity;
  data: LeadGrowthDataPoint[];
  summary: {
    total_leads: number;
    total_conversions: number;
    leads_delta_percent: number;
    conversion_rate_percent: number;
    conversion_rate_delta_percent: number;
  };
}

export interface SalesRepRawItem {
  id: string;
  rep_name: string;
  avatar_initials: string;
  deals_closed: number;
  revenue: { value: number; currency_code: string };
  performance_percent: number; // 0-100, quota attainment
  created_at: string;
  updated_at: string;
}

export interface LeadsReportRawResponse {
  dashboard_id: string;
  generated_at: string;
  timezone: string;
  reps: SalesRepRawItem[];
}

export type TaskItemType = "task" | "meeting" | "call";

export interface TaskItemRawItem {
  id: string;
  day_of_week: number; // 0 = Sunday .. 6 = Saturday
  title: string;
  time_label: string;
  type: TaskItemType;
}

export interface UpcomingTasksRawResponse {
  resource: "upcoming_tasks";
  generated_at: string;
  week_start: string; // ISO 8601 date of the Sunday for the current week
  data: TaskItemRawItem[];
}

export type ActivityType =
  | "call"
  | "email"
  | "meeting"
  | "deal_won"
  | "deal_lost"
  | "note"
  | "task_completed";

export interface ActivityRawItem {
  id: string;
  type: ActivityType;
  actor_name: string;
  description: string;
  created_at: string; // ISO 8601
}

export interface RecentActivitiesRawResponse {
  resource: "activity_feed";
  generated_at: string;
  data: ActivityRawItem[];
  meta: {
    total: number;
    has_more: boolean;
  };
}
