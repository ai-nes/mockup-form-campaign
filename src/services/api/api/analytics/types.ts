export type AnalyticsGranularity = "weekly" | "monthly";

export interface VisitorsDataPoint {
  id: string;
  period_start: string; // ISO 8601
  period_end: string; // ISO 8601
  label: string; // Display label ("Mon", "Jan", etc.)
  visitors: {
    value: number;
  };
  unique_visitors: {
    value: number;
  };
}

export interface VisitorsAnalyticsRawResponse {
  chart_id: string;
  organization_id: string;
  generated_at: string;
  timezone: string;
  granularity: AnalyticsGranularity;
  data: VisitorsDataPoint[];
  summary: {
    total_visitors: number;
    total_unique_visitors: number;
    visitors_delta_percent: number;
    unique_visitors_delta_percent: number;
  };
}

export type DeviceType = "desktop" | "mobile" | "tablet";

export interface UsedDeviceRawItem {
  id: string;
  device_type: DeviceType;
  session_count: number;
  percentage: number;
}

export interface UsedDevicesRawResponse {
  dashboard_id: string;
  generated_at: string;
  timezone: string;
  total_sessions: number;
  devices: UsedDeviceRawItem[];
}

export interface TopCountryRawItem {
  id: string;
  country_name: string;
  country_code: string;
  visitor_count: number;
  percentage: number;
}

export interface TopCountriesRawResponse {
  dashboard_id: string;
  generated_at: string;
  timezone: string;
  countries: TopCountryRawItem[];
}

export interface TopContentRawItem {
  id: string;
  url_path: string;
  views_count: number;
  unique_views_count: number;
}

export interface TopContentRawResponse {
  dashboard_id: string;
  generated_at: string;
  timezone: string;
  pages: TopContentRawItem[];
}

export interface TopChannelRawItem {
  id: string;
  channel_name: string;
  views_count: number;
  unique_views_count: number;
}

export interface TopChannelsRawResponse {
  dashboard_id: string;
  generated_at: string;
  timezone: string;
  channels: TopChannelRawItem[];
}
