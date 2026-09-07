export type DemographicTone = "primary" | "info" | "success" | "warning" | "danger";

export interface SegmentFilter {
  id: string;
  label: string;
  value: string;
}

export interface SegmentChannel {
  name: string;
  value: number;
  fill?: string;
}

export interface SegmentTrendPoint {
  month: string;
  current: number | null;
  benchmark: number | null;
}

export interface DemographicKpi {
  id: string;
  label: string;
  value: string;
  change: string;
  helper: string;
  progress: number;
  tone: DemographicTone;
}

export interface DemandTrendPoint {
  month: string;
  ai: number | null;
  software: number | null;
  business: number | null;
  design: number | null;
}

export interface DemandSummaryItem {
  id: string;
  label: string;
  value: number | null;
  change: number | null;
}

export interface DemandOverview {
  trend: DemandTrendPoint[];
  summary: DemandSummaryItem[];
}

export interface AudienceGender {
  id: string;
  name: string;
  value: number;
  fill?: string;
}

export interface AudienceProfile {
  id: string;
  label: string;
  value: number;
  count: number;
  detail?: string;
  color?: string;
}

export interface AudienceComposition {
  total: number;
  gender: AudienceGender[];
  profiles: AudienceProfile[];
}

export type ChannelAttributionModel = "first-touch" | "last-touch" | "observed-interactions";

export interface DemographicSegment {
  id: string;
  name: string;
  shortName: string;
  description: string;
  region: string;
  interest: string;
  prospects: number;
  engaged: number;
  qualified: number;
  counselling: number;
  applications: number;
  enrolled: number;
  conversion: number | null;
  tuition: number | null;
  revenue: number | null;
  growth: number | null;
  coverage: number;
  opportunityScore: number;
  tone: DemographicTone;
  filters: SegmentFilter[];
  channels: SegmentChannel[];
  channelAttributionModel?: ChannelAttributionModel;
  monthlyProspects: SegmentTrendPoint[];
}

export interface RegionOpportunity {
  rank: number;
  name: string;
  score: number;
  selected?: boolean;
}

export interface RegionalDemandMatrix {
  metric?: "count" | "relative-index";
  unit?: "contacts" | "score";
  columns: Array<{ id: string; name: string }>;
  rows: Array<{
    interest: string;
    values?: Record<string, number | null>;
    scores?: Record<string, number | null>;
  }>;
}

export interface AcquisitionPlatformLeadCost {
  platform: string;
  leads: number;
  validLeads: number;
  spend: number;
  cpl: number | null;
}

export interface AcquisitionSeasonComparison {
  week: string;
  current: number;
  previous: number;
}

export interface AcquisitionDailySpendLeads {
  day: string;
  spend: number;
  leads: number;
}

export interface AcquisitionTouchpointPlatformMatrix {
  columns: string[];
  rows: Array<{ label: string; values: Array<number | null> }>;
}

export interface AcquisitionBudgetRole {
  label: string;
  value: number;
}

export interface AcquisitionFormFunnelStep {
  label: string;
  value: number;
  retention: number | null;
}

export interface AcquisitionFormCompletion {
  id?: string;
  label: string;
  value: number | null;
  denominator?: number;
}

export interface AcquisitionFormDropoff {
  field: string;
  dropoff: number | null;
  cumulative: number | null;
}

export interface AcquisitionCaptureModeComparison {
  label: string;
  validRate: number | null;
  completeRate: number | null;
}

export interface AcquisitionLeadQualityBySource {
  source: string;
  valid: number;
  enrichment: number;
  invalid: number;
  outOfScope: number;
  duplicate: number;
}

export interface AcquisitionValidRateTrendPoint {
  week: string;
  values: Record<string, number | null>;
}

export interface AcquisitionDataCompleteness {
  field: string;
  value: number | null;
}

export interface AcquisitionIdentityMatch {
  label: string;
  value: number;
}

export interface AcquisitionSourceCount {
  source: string;
  value: number;
}

export interface AcquisitionFirstVsLastSource {
  source: string;
  first: number;
  last: number;
}

export interface AcquisitionAttributionFlow {
  label: string;
  value: number;
}

export interface AcquisitionCohortEnrollment {
  cohort: string;
  values: Array<number | null>;
}

export interface AcquisitionEnrollmentLagBucket {
  range: string;
  value: number;
}

export interface AcquisitionCumulativeConversion {
  week: string;
  value: number | null;
}

export interface AcquisitionContactLatency {
  window: string;
  min: number | null;
  q1: number | null;
  median: number | null;
  q3: number | null;
  max: number | null;
}

export interface AcquisitionSubmissionTiming {
  weekdays: string[];
  hours: string[];
  values: Array<Array<number | null>>;
  timezone: string;
}

export interface AcquisitionAttributionModel {
  firstTouch: "first-touch";
  lastTouch: "last-touch";
}

export interface AcquisitionHandoffSuccess {
  source: string;
  success: number | null;
  contacted: number | null;
}

export interface AcquisitionCostPerEnrolled {
  source: string;
  cost: number | null;
  enrolled: number;
}

export interface AcquisitionMapData {
  attributionModel: AcquisitionAttributionModel;
  platformLeadCost: AcquisitionPlatformLeadCost[];
  leadTrendComparison: AcquisitionSeasonComparison[];
  dailySpendLeads: AcquisitionDailySpendLeads[];
  touchpointPlatformMatrix: AcquisitionTouchpointPlatformMatrix;
  budgetByPlatformRole: AcquisitionBudgetRole[];
  formFunnel: AcquisitionFormFunnelStep[];
  formCompletion: AcquisitionFormCompletion[];
  formDropoffByField: AcquisitionFormDropoff[];
  captureModeComparison: AcquisitionCaptureModeComparison[];
  leadQualityBySource: AcquisitionLeadQualityBySource[];
  validLeadRateTrend: AcquisitionValidRateTrendPoint[];
  handoffDataCompleteness: AcquisitionDataCompleteness[];
  identityMatchBreakdown: AcquisitionIdentityMatch[];
  firstTouchBySource: AcquisitionSourceCount[];
  lastTouchBySource: AcquisitionSourceCount[];
  firstVsLastSource: AcquisitionFirstVsLastSource[];
  attributionFlow: AcquisitionAttributionFlow[];
  cohortEnrollmentMatrix: AcquisitionCohortEnrollment[];
  enrollmentLagHistogram: {
    medianDays: number | null;
    buckets: AcquisitionEnrollmentLagBucket[];
  };
  cumulativeConversion: AcquisitionCumulativeConversion[];
  firstContactLatency: AcquisitionContactLatency[];
  submissionTiming: AcquisitionSubmissionTiming;
  handoffSuccessBySource: AcquisitionHandoffSuccess[];
  costPerEnrolledBySource: AcquisitionCostPerEnrolled[];
}

export interface DemographicsFilterOptions {
  provinces: string[];
  majors: string[];
  stages: string[];
  priorities: string[];
  owners: string[];
  sourceGroups: string[];
}

export interface DataCoverageMetric {
  label: string;
  detail: string;
  value: number;
  tone: "success" | "warning" | "danger";
}

export interface SegmentNextActionStep {
  order: number;
  title: string;
  detail: string;
}

export interface SegmentNextAction {
  priority: "high" | "normal";
  label: string;
  title: string;
  description: string;
  steps: SegmentNextActionStep[];
}

export interface SegmentGuardrail {
  criterion: string;
  issue: string;
  replacement: string;
  status: string;
  tone: "success" | "warning" | "error";
}

export interface DirectorDemographicsOverviewParams {
  admissionYear?: number;
  page?: number;
  pageSize?: number;
  period?: "6m" | "12m" | "season" | string;
  scope?: "all" | string;
  province?: string;
  major?: string;
  stage?: string;
  priority?: string;
  owner?: string;
  sourceGroup?: string;
}

export interface DirectorDemographicsOverviewData {
  kpis: DemographicKpi[];
  demand: DemandOverview;
  audienceComposition: AudienceComposition;
  segments: DemographicSegment[];
  acquisitionMap: AcquisitionMapData;
  regionOpportunities: RegionOpportunity[];
  regionalDemand: RegionalDemandMatrix;
  dataCoverage: DataCoverageMetric[];
  filterOptions?: DemographicsFilterOptions;
}

export interface DirectorDemographicsOverviewMeta {
  admissionYear: number;
  period: string;
  scope: string;
  asOf: string;
  totalProspects: number;
  minSampleSize: number;
  /** Pagination of data.segments. Required for the overview response. */
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  dataAvailability?: {
    trend: boolean | "complete" | "partial" | "unavailable";
    tuition: boolean;
    revenue: boolean;
    eligibleSegments: number;
    acquisitionMap?: "complete" | "partial" | "unavailable";
  };
}

export interface DirectorDemographicsOverviewResponse {
  data: DirectorDemographicsOverviewData;
  meta: DirectorDemographicsOverviewMeta;
}

export interface DirectorDemographicsSegmentParams {
  segment_id: string;
  admissionYear?: number;
}

export interface DirectorDemographicsSegmentData {
  segment: DemographicSegment;
  benchmark: DemographicSegment;
  regionOpportunities: RegionOpportunity[];
  nextAction: SegmentNextAction;
  guardrails: SegmentGuardrail[];
}

export interface DirectorDemographicsSegmentMeta {
  admissionYear: number;
  asOf: string;
  minSampleSize: number;
  sampleSize: number;
}

export interface DirectorDemographicsSegmentResponse {
  data: DirectorDemographicsSegmentData;
  meta: DirectorDemographicsSegmentMeta;
}
