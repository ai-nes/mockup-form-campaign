import type { AcquisitionMapData } from "./types";

export const acquisitionMapData: AcquisitionMapData = {
  attributionModel: {
    firstTouch: "first-touch",
    lastTouch: "last-touch",
  },
  platformLeadCost: [],
  leadTrendComparison: [],
  dailySpendLeads: [],
  touchpointPlatformMatrix: {
    columns: [],
    rows: [],
  },
  budgetByPlatformRole: [],
  formFunnel: [],
  formCompletion: [],
  formDropoffByField: [],
  captureModeComparison: [],
  leadQualityBySource: [],
  validLeadRateTrend: [],
  handoffDataCompleteness: [],
  identityMatchBreakdown: [],
  firstTouchBySource: [],
  lastTouchBySource: [],
  firstVsLastSource: [],
  attributionFlow: [],
  cohortEnrollmentMatrix: [],
  enrollmentLagHistogram: {
    medianDays: null,
    buckets: [],
  },
  cumulativeConversion: [],
  firstContactLatency: [],
  submissionTiming: {
    weekdays: [],
    hours: [],
    values: [],
    timezone: "",
  },
  handoffSuccessBySource: [],
  costPerEnrolledBySource: [],
};

export const heatmapScale = [
  "var(--background-soft-100)",
  "var(--primary-100)",
  "var(--primary-200)",
  "var(--brand-500)",
];

export const platformLeadCost = acquisitionMapData.platformLeadCost;
export const leadTrendComparison = acquisitionMapData.leadTrendComparison;
export const dailySpendLeads = acquisitionMapData.dailySpendLeads;
export const touchpointPlatformMatrix = acquisitionMapData.touchpointPlatformMatrix;
export const budgetByPlatformRole = acquisitionMapData.budgetByPlatformRole;
export const formFunnel = acquisitionMapData.formFunnel;
export const formCompletion = acquisitionMapData.formCompletion;
export const formDropoffByField = acquisitionMapData.formDropoffByField;
export const captureModeComparison = acquisitionMapData.captureModeComparison;
export const leadQualityBySource = acquisitionMapData.leadQualityBySource;
export const validLeadRateTrend = acquisitionMapData.validLeadRateTrend;
export const handoffDataCompleteness = acquisitionMapData.handoffDataCompleteness;
export const identityMatchBreakdown = acquisitionMapData.identityMatchBreakdown;
export const firstTouchBySource = acquisitionMapData.firstTouchBySource;
export const lastTouchBySource = acquisitionMapData.lastTouchBySource;
export const firstVsLastSource = acquisitionMapData.firstVsLastSource;
export const attributionFlow = acquisitionMapData.attributionFlow;
export const cohortEnrollmentMatrix = acquisitionMapData.cohortEnrollmentMatrix;
export const enrollmentLagHistogram = acquisitionMapData.enrollmentLagHistogram;
export const cumulativeConversion = acquisitionMapData.cumulativeConversion;
export const firstContactLatency = acquisitionMapData.firstContactLatency;
export const submissionTiming = acquisitionMapData.submissionTiming;
export const handoffSuccessBySource = acquisitionMapData.handoffSuccessBySource;
export const costPerEnrolledBySource = acquisitionMapData.costPerEnrolledBySource;
