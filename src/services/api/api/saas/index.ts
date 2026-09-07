import { delay } from "@/utils/delay";
import {
  customerGrowthMonthlyRawData,
  customerGrowthYearlyRawData,
  planMixRawData,
  recentActivitiesRawData,
  recentSignupsRawData,
  revenueOverviewMonthlyRawData,
  revenueOverviewYearlyRawData,
} from "./data";
import type {
  CustomerGrowthRawResponse,
  Granularity,
  PlanMixRawResponse,
  RecentActivitiesRawResponse,
  RecentSignupsRawResponse,
  RevenueOverviewRawResponse,
} from "./types";

export type * from "./types";

export async function getRevenueOverviewData(
  granularity: Granularity = "monthly",
): Promise<RevenueOverviewRawResponse> {
  await delay(1200);
  return granularity === "yearly" ? revenueOverviewYearlyRawData : revenueOverviewMonthlyRawData;
}

export async function getCustomerGrowthData(
  granularity: Granularity = "monthly",
): Promise<CustomerGrowthRawResponse> {
  await delay(1100);
  return granularity === "yearly" ? customerGrowthYearlyRawData : customerGrowthMonthlyRawData;
}

export async function getPlanMixData(): Promise<PlanMixRawResponse> {
  await delay(900);
  return planMixRawData;
}

export async function getRecentSignupsData(): Promise<RecentSignupsRawResponse> {
  await delay(950);
  return recentSignupsRawData;
}

export async function getRecentActivitiesData(): Promise<RecentActivitiesRawResponse> {
  await delay(1000);
  return recentActivitiesRawData;
}
