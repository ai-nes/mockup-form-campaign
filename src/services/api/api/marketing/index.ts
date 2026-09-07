import { delay } from "@/utils/delay";
import {
  audienceInsightsRawData,
  campaignVisitorsRawData,
  channelPerformanceRawData,
  conversionFunnelRawData,
  marketingOverviewStatsRawData,
  recentActivitiesRawData,
} from "./data";
import type {
  AudienceInsightsRawResponse,
  CampaignVisitorsRawResponse,
  ChannelPerformanceRawResponse,
  ConversionFunnelRawResponse,
  MarketingOverviewStatsRawResponse,
  MarketingTimeRange,
  RecentActivitiesRawResponse,
} from "./types";

export type * from "./types";

export async function getMarketingOverviewStats(
  period: MarketingTimeRange = "7d",
): Promise<MarketingOverviewStatsRawResponse> {
  await delay(860);
  return marketingOverviewStatsRawData[period];
}

export async function getCampaignVisitorsData(
  period: MarketingTimeRange = "7d",
): Promise<CampaignVisitorsRawResponse> {
  await delay(1200);
  return campaignVisitorsRawData[period];
}

export async function getAudienceInsightsData(): Promise<AudienceInsightsRawResponse> {
  await delay(1000);
  return audienceInsightsRawData;
}

export async function getConversionFunnelData(): Promise<ConversionFunnelRawResponse> {
  await delay(1000);
  return conversionFunnelRawData;
}

export async function getChannelPerformanceData(): Promise<ChannelPerformanceRawResponse> {
  await delay(950);
  return channelPerformanceRawData;
}

export async function getRecentActivitiesData(): Promise<RecentActivitiesRawResponse> {
  await delay(900);
  return recentActivitiesRawData;
}
