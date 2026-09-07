import type {
  AudienceInsightsRawResponse,
  CampaignVisitorsRawResponse,
  ChannelPerformanceRawResponse,
  ConversionFunnelRawResponse,
  MarketingOverviewStatsRawResponse,
  MarketingTimeRange,
  RecentActivitiesRawResponse,
} from "./types";

const marketingTimeRanges: MarketingTimeRange[] = ["7d", "30d", "90d"];

function emptyMarketingOverviewStatsRawData(period: MarketingTimeRange): MarketingOverviewStatsRawResponse {
  return {
    dashboard_id: "",
    generated_at: "",
    timezone: "",
    period,
    metrics: [],
  };
}

function emptyCampaignVisitorsRawData(period: MarketingTimeRange): CampaignVisitorsRawResponse {
  return {
    chart_id: "",
    organization_id: "",
    generated_at: "",
    timezone: "",
    period,
    data: [],
    summary: {
      total_visitors: 0,
      delta_percent: 0,
    },
  };
}

export const marketingOverviewStatsRawData: Record<MarketingTimeRange, MarketingOverviewStatsRawResponse> =
  marketingTimeRanges.reduce(
    (acc, period) => {
      acc[period] = emptyMarketingOverviewStatsRawData(period);
      return acc;
    },
    {} as Record<MarketingTimeRange, MarketingOverviewStatsRawResponse>,
  );

export const campaignVisitorsRawData: Record<MarketingTimeRange, CampaignVisitorsRawResponse> =
  marketingTimeRanges.reduce(
    (acc, period) => {
      acc[period] = emptyCampaignVisitorsRawData(period);
      return acc;
    },
    {} as Record<MarketingTimeRange, CampaignVisitorsRawResponse>,
  );

export const audienceInsightsRawData: AudienceInsightsRawResponse = {
  dashboard_id: "",
  generated_at: "",
  timezone: "",
  segments: [],
};

export const conversionFunnelRawData: ConversionFunnelRawResponse = {
  funnel_id: "",
  generated_at: "",
  timezone: "",
  stages: [],
};

export const channelPerformanceRawData: ChannelPerformanceRawResponse = {
  dashboard_id: "",
  generated_at: "",
  timezone: "",
  channels: [],
};

export const recentActivitiesRawData: RecentActivitiesRawResponse = {
  dashboard_id: "",
  generated_at: "",
  activities: [],
};
