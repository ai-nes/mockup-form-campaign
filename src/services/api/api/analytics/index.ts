import { delay } from "@/utils/delay";
import {
  topChannelsRawData,
  topContentRawData,
  topCountriesRawData,
  usedDevicesRawData,
  visitorsAnalyticsMonthlyRawData,
  visitorsAnalyticsWeeklyRawData,
} from "./data";
import type {
  AnalyticsGranularity,
  TopChannelsRawResponse,
  TopContentRawResponse,
  TopCountriesRawResponse,
  UsedDevicesRawResponse,
  VisitorsAnalyticsRawResponse,
} from "./types";

export type * from "./types";

export async function getVisitorsAnalyticsData(
  granularity: AnalyticsGranularity = "monthly",
): Promise<VisitorsAnalyticsRawResponse> {
  await delay(1200);
  return granularity === "weekly" ? visitorsAnalyticsWeeklyRawData : visitorsAnalyticsMonthlyRawData;
}

export async function getUsedDevicesData(): Promise<UsedDevicesRawResponse> {
  await delay(900);
  return usedDevicesRawData;
}

export async function getTopCountriesData(): Promise<TopCountriesRawResponse> {
  await delay(1000);
  return topCountriesRawData;
}

export async function getTopContentData(): Promise<TopContentRawResponse> {
  await delay(950);
  return topContentRawData;
}

export async function getTopChannelsData(): Promise<TopChannelsRawResponse> {
  await delay(1000);
  return topChannelsRawData;
}
