import { delay } from "@/utils/delay";
import {
  aiAgentsRawData,
  aiCostAnalyticsMonthlyRawData,
  aiCostAnalyticsYearlyRawData,
  aiProviderDistributionRawData,
  recentActivitiesRawData,
  topUsageRawData,
  weeklyAiActivityRawData,
} from "./data";
import type {
  AiAgentsRawResponse,
  AiCostAnalyticsRawResponse,
  AiGranularity,
  AiProviderDistributionRawResponse,
  RecentActivitiesRawResponse,
  TopUsageRawResponse,
  WeeklyAiActivityRawResponse,
} from "./types";

export type * from "./types";

export async function getAiCostAnalyticsData(
  granularity: AiGranularity = "monthly",
): Promise<AiCostAnalyticsRawResponse> {
  await delay(900);
  return granularity === "yearly" ? aiCostAnalyticsYearlyRawData : aiCostAnalyticsMonthlyRawData;
}

export async function getWeeklyAiActivityData(): Promise<WeeklyAiActivityRawResponse> {
  await delay(1100);
  return weeklyAiActivityRawData;
}

export async function getTopUsageData(): Promise<TopUsageRawResponse> {
  await delay(900);
  return topUsageRawData;
}

export async function getAiAgentsData(): Promise<AiAgentsRawResponse> {
  await delay(950);
  return aiAgentsRawData;
}

export async function getRecentActivitiesData(): Promise<RecentActivitiesRawResponse> {
  await delay(850);
  return recentActivitiesRawData;
}

export async function getAiProviderDistributionData(): Promise<AiProviderDistributionRawResponse> {
  await delay(1000);
  return aiProviderDistributionRawData;
}
