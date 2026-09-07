import { delay } from "@/utils/delay";
import {
  leadGrowthMonthlyRawData,
  leadGrowthQuarterlyRawData,
  leadGrowthWeeklyRawData,
  leadsReportRawData,
  recentActivitiesRawData,
  upcomingTasksRawData,
} from "./data";
import type {
  LeadGrowthGranularity,
  LeadGrowthRawResponse,
  LeadsReportRawResponse,
  RecentActivitiesRawResponse,
  UpcomingTasksRawResponse,
} from "./types";

export type * from "./types";

export async function getLeadGrowthData(
  granularity: LeadGrowthGranularity = "7d",
): Promise<LeadGrowthRawResponse> {
  await delay(1200);
  if (granularity === "30d") return leadGrowthMonthlyRawData;
  if (granularity === "90d") return leadGrowthQuarterlyRawData;
  return leadGrowthWeeklyRawData;
}

export async function getLeadsReportData(): Promise<LeadsReportRawResponse> {
  await delay(950);
  return leadsReportRawData;
}

export async function getUpcomingTasksData(): Promise<UpcomingTasksRawResponse> {
  await delay(850);
  return upcomingTasksRawData;
}

export async function getRecentActivitiesData(): Promise<RecentActivitiesRawResponse> {
  await delay(900);
  return recentActivitiesRawData;
}
