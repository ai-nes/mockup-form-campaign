import type {
  AudienceComposition,
  DataCoverageMetric,
  DemandOverview,
  DemographicKpi,
  DemographicSegment,
  DirectorDemographicsOverviewParams,
  DirectorDemographicsOverviewResponse,
  DirectorDemographicsSegmentParams,
  DirectorDemographicsSegmentResponse,
  RegionOpportunity,
  RegionalDemandMatrix,
  SegmentFilter,
  SegmentGuardrail,
  SegmentNextAction,
} from "./types";
import { acquisitionMapData } from "./acquisition-map-data";

export const initialFilters: SegmentFilter[] = [];

export const regionOpportunities: RegionOpportunity[] = [];

export const demographicKpis: DemographicKpi[] = [];

export const demandOverviewData: DemandOverview = {
  trend: [],
  summary: [],
};

export const audienceCompositionData: AudienceComposition = {
  total: 0,
  gender: [],
  profiles: [],
};

export const regionalDemandMatrixData: RegionalDemandMatrix = {
  metric: "relative-index",
  unit: "score",
  columns: [],
  rows: [],
};

export const dataCoverageMetrics: DataCoverageMetric[] = [];

export const defaultGuardrails: SegmentGuardrail[] = [];

export const demographicSegments: DemographicSegment[] = [];

export function getSegmentForFilters(filters: SegmentFilter[]): DemographicSegment | null {
  const matchingSegments = demographicSegments.filter((segment) =>
    filters.every((filter) =>
      segment.filters.some((segmentFilter) => segmentFilter.id === filter.id && segmentFilter.value === filter.value),
    ),
  );
  if (matchingSegments.length === 0) return null;
  if (matchingSegments.length === 1) return matchingSegments[0];

  const prospects = matchingSegments.reduce((sum, segment) => sum + segment.prospects, 0);
  const engaged = matchingSegments.reduce((sum, segment) => sum + segment.engaged, 0);
  const qualified = matchingSegments.reduce((sum, segment) => sum + segment.qualified, 0);
  const counselling = matchingSegments.reduce((sum, segment) => sum + segment.counselling, 0);
  const applications = matchingSegments.reduce((sum, segment) => sum + segment.applications, 0);
  const enrolled = matchingSegments.reduce((sum, segment) => sum + segment.enrolled, 0);
  const weighted = (key: "tuition" | "growth" | "coverage" | "opportunityScore") =>
    matchingSegments.reduce((sum, segment) => sum + (segment[key] ?? 0) * segment.prospects, 0) / prospects;
  const monthlyProspects = matchingSegments[0].monthlyProspects.map((point, index) => ({
    month: point.month,
    current: matchingSegments.reduce((sum, segment) => sum + (segment.monthlyProspects[index].current ?? 0), 0),
    benchmark: matchingSegments.reduce((sum, segment) => sum + (segment.monthlyProspects[index].benchmark ?? 0), 0),
  }));
  const previousMonth = monthlyProspects[monthlyProspects.length - 2]?.current ?? 0;
  const latestMonth = monthlyProspects[monthlyProspects.length - 1]?.current ?? 0;
  const channelNames = Array.from(new Set(matchingSegments.flatMap((segment) => segment.channels.map((channel) => channel.name))));
  const channels = channelNames.map((name) => {
    const value =
      matchingSegments.reduce(
        (sum, segment) => sum + (segment.channels.find((channel) => channel.name === name)?.value ?? 0) * segment.engaged,
        0,
      ) / (engaged || 1);
    const fill = matchingSegments.flatMap((segment) => segment.channels).find((channel) => channel.name === name)?.fill ?? "var(--brand-500)";
    return { name, value: Number(value.toFixed(1)), fill };
  });
  const opportunityScore = weighted("opportunityScore");

  return {
    id: `custom-${filters.map((filter) => `${filter.id}-${filter.value}`).join("-")}`,
    name: filters.length > 0 ? filters.map((filter) => filter.value).join(" · ") : "Tất cả học sinh",
    shortName: filters.length > 0 ? filters.map((filter) => filter.value).slice(0, 3).join(" · ") : "Tất cả",
    description: `Có ${prospects.toLocaleString("vi-VN")} lead theo điều kiện đang chọn.`,
    region: filters.find((filter) => filter.id === "province" || filter.id === "region")?.value ?? "Nhiều khu vực",
    interest: filters.find((filter) => filter.id === "interest")?.value ?? "Nhiều nhóm ngành",
    prospects,
    engaged,
    qualified,
    counselling,
    applications,
    enrolled,
    conversion: prospects > 0 ? Number(((enrolled / prospects) * 100).toFixed(1)) : 0,
    tuition: enrolled > 0 ? matchingSegments.reduce((sum, segment) => sum + (segment.tuition ?? 0) * segment.enrolled, 0) / enrolled : weighted("tuition"),
    revenue: matchingSegments.reduce((sum, segment) => sum + (segment.revenue ?? 0), 0),
    growth: previousMonth > 0 ? Number((((latestMonth - previousMonth) / previousMonth) * 100).toFixed(1)) : Number(weighted("growth").toFixed(1)),
    coverage: Number(weighted("coverage").toFixed(1)),
    opportunityScore: Math.round(opportunityScore),
    tone: opportunityScore >= 85 ? "primary" : opportunityScore >= 70 ? "info" : opportunityScore >= 55 ? "success" : "warning",
    filters,
    channels,
    monthlyProspects,
  };
}

export function getAvailableSegmentFilters(filters: SegmentFilter[]) {
  const candidates = demographicSegments.flatMap((segment) => segment.filters);
  return candidates.filter((candidate, index, allCandidates) => {
    const isUnique = allCandidates.findIndex((item) => item.id === candidate.id && item.value === candidate.value) === index;
    const dimensionAlreadyUsed = filters.some((filter) => filter.id === candidate.id);
    return isUnique && !dimensionAlreadyUsed && getSegmentForFilters([...filters, candidate]) !== null;
  });
}

export function computeDirectorDemographicsOverview(
  params?: DirectorDemographicsOverviewParams,
): DirectorDemographicsOverviewResponse {
  const admissionYear = params?.admissionYear ?? 2026;
  const page = Math.max(1, Math.floor(params?.page ?? 1));
  const pageSize = Math.max(1, Math.min(Math.floor(params?.pageSize ?? 5), 100));
  const period = params?.period ?? "6m";
  const scope = params?.scope ?? "all";
  const rankedSegments = [...demographicSegments].sort((first, second) => {
    const scoreDifference = second.opportunityScore - first.opportunityScore;
    return scoreDifference || first.id.localeCompare(second.id);
  });
  const total = rankedSegments.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasNextPage = page < totalPages;

  return {
    data: {
      kpis: demographicKpis,
      demand: demandOverviewData,
      audienceComposition: audienceCompositionData,
      segments: rankedSegments.slice((page - 1) * pageSize, page * pageSize),
      acquisitionMap: acquisitionMapData,
      regionOpportunities,
      regionalDemand: regionalDemandMatrixData,
      dataCoverage: dataCoverageMetrics,
    },
    meta: {
      admissionYear,
      period,
      scope,
      asOf: "",
      totalProspects: audienceCompositionData.total,
      minSampleSize: 30,
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage,
      dataAvailability: {
        trend: false,
        tuition: false,
        revenue: false,
        eligibleSegments: total,
        acquisitionMap: "unavailable",
      },
    },
  };
}

export function computeDirectorDemographicsSegment(
  params: DirectorDemographicsSegmentParams,
): DirectorDemographicsSegmentResponse | null {
  const segment = demographicSegments.find((item) => item.id === params.segment_id);
  if (!segment) return null;

  const benchmark =
    demographicSegments.find((item) => item.id !== segment.id && item.region === segment.region) ??
    demographicSegments.find((item) => item.id !== segment.id) ??
    segment;

  const nextAction: SegmentNextAction = {
    priority: segment.opportunityScore >= 85 ? "high" : "normal",
    label: segment.opportunityScore >= 85 ? "Ưu tiên cao" : "Theo dõi thường quy",
    title: segment.opportunityScore >= 85 ? "Ưu tiên tiếp cận sớm" : "Duy trì nhịp chăm sóc tiêu chuẩn",
    description: `Nhóm có ${segment.prospects.toLocaleString("vi-VN")} lead và đang tăng trưởng ${segment.growth}%.`,
    steps: [
      {
        order: 1,
        title: `Tiếp cận qua ${segment.channels[0]?.name ?? "Mạng xã hội"}`,
        detail: `${segment.channels[0]?.value ?? 0}% tương tác đầu tiên đến từ kênh này.`,
      },
      {
        order: 2,
        title: "Tổ chức một hoạt động tư vấn chuyên sâu",
        detail: `Tập trung vào ${segment.interest}; giải đáp học phí và học bổng.`,
      },
      {
        order: 3,
        title: "Đánh giá lại sau 30 ngày",
        detail: "So sánh số lead được tiếp cận, nộp hồ sơ và nhập học.",
      },
    ],
  };

  return {
    data: {
      segment,
      benchmark,
      regionOpportunities,
      nextAction,
      guardrails: defaultGuardrails,
    },
    meta: {
      admissionYear: params.admissionYear ?? 2026,
      asOf: "",
      minSampleSize: 30,
      sampleSize: segment.prospects,
    },
  };
}
