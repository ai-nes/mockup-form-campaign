import type {
  DataAvailability,
  DirectorMarketOverview,
  DirectorMarketRegionSummary,
  DirectorMarketMeta,
  DirectorMarketMetricConfig,
  DirectorMarketProvince,
  DirectorMarketSchool,
  MarketRegionKey,
  MarketMetricAvailability,
  MarketSchoolCoordinates,
  MarketSchoolClassification,
  MarketSchoolParticipation,
} from "./types";

const statuses = new Set(["available", "partial", "unavailable"]);
const regions = new Set(["all", "north", "central", "highlands", "south", "mekong"]);
const classifications = new Set(["Trọng điểm", "Mở rộng", "Duy trì", "Sàng lọc"]);
const metrics = new Set(["opportunity", "leads", "conversion", "competition", "revenue"]);

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function number(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function coordinates(value: unknown): MarketSchoolCoordinates | null {
  const source = record(value);
  const latitude = number(source.latitude ?? source.lat);
  const longitude = number(source.longitude ?? source.lng ?? source.lon);
  return latitude !== null && longitude !== null ? { latitude, longitude } : null;
}

function normalizeParticipations(value: unknown): MarketSchoolParticipation[] {
  if (!Array.isArray(value)) return [];

  return value.map((item) => {
    const source = record(item);
    const id = text(source.id ?? source.eventId ?? source.event_id ?? source.campaignId ?? source.campaign_id);
    const name = text(source.name ?? source.title);
    const type = text(source.type ?? source.participationType ?? source.participation_type);
    if (!id || !name || (type !== "event" && type !== "campaign")) return null;

    return {
      id,
      name,
      type,
      occurredAt: text(source.occurredAt ?? source.occurred_at ?? source.startedAt ?? source.started_at),
    };
  }).filter((item): item is MarketSchoolParticipation => item !== null);
}

function availability(value: unknown): DataAvailability {
  const source = record(value);
  const normalizeMap = (candidate: unknown) =>
    Object.fromEntries(
      Object.entries(record(candidate)).filter(([, status]) => statuses.has(String(status))),
    ) as DataAvailability["sections"];

  return {
    status: statuses.has(String(source.status)) ? (source.status as DataAvailability["status"]) : undefined,
    sections: normalizeMap(source.sections),
    fields: normalizeMap(source.fields),
  };
}

function metricAvailability(value: unknown): MarketMetricAvailability {
  const source = record(value);
  const getStatus = (key: keyof MarketMetricAvailability) => {
    const candidate = source[key] ?? source[key.replace(/[A-Z]/g, (character) => `_${character.toLowerCase()}`)];
    return statuses.has(String(candidate)) ? (candidate as DataAvailability["status"]) ?? "unavailable" : "unavailable";
  };

  return {
    opportunity: getStatus("opportunity"),
    competition: getStatus("competition"),
    revenue: getStatus("revenue"),
    grade12Population: getStatus("grade12Population"),
  } as MarketMetricAvailability;
}

function normalizeSchool(value: unknown, fallbackId: string): DirectorMarketSchool | null {
  const source = record(value);
  const directoryId = text(source.directoryId ?? source.directory_id ?? source.externalId ?? source.id);
  const name = text(source.name);
  if (!name) return null;

  const classificationValue = text(source.classification);
  const locality = record(source.locality);
  const coordinateSource = source.coordinates ?? locality.coordinates ?? record(locality.source).coordinates;
  return {
    id: text(source.id) ?? fallbackId,
    directoryId,
    name,
    district: text(source.district),
    coordinates: coordinates(coordinateSource) ?? coordinates({
      latitude: source.latitude ?? source.lat ?? locality.latitude,
      longitude: source.longitude ?? source.lng ?? source.lon ?? locality.longitude,
    }),
    tier: (["Tier 1", "Tier 2", "Tier 3"] as const).find((item) => item === source.tier) ?? null,
    potentialScore: number(source.potentialScore),
    grade12Students: number(source.grade12Students),
    prospects: number(source.prospects),
    penetrationRate: number(source.penetrationRate),
    applications: number(source.applications),
    enrollmentForecast: number(source.enrollmentForecast),
    conversionRate: number(source.conversionRate),
    lastActivity: text(source.lastActivity),
    recommendation: text(source.recommendation),
    nextAction: text(source.nextAction),
    classification: classifications.has(classificationValue ?? "")
      ? (classificationValue as MarketSchoolClassification)
      : null,
    participations: normalizeParticipations(
      source.participations ?? source.eventParticipations ?? source.event_participations ?? source.activities,
    ),
  };
}

function normalizeProvince(value: unknown): DirectorMarketProvince | null {
  const source = record(value);
  const code = text(source.code);
  const name = text(source.name);
  if (!code || !name) return null;
  const region = text(source.regionKey ?? source.region_key);
  const schools = Array.isArray(source.highSchools) ? source.highSchools : [];

  return {
    code,
    name,
    fullName: text(source.fullName ?? source.full_name),
    regionKey: regions.has(region ?? "") ? (region as MarketRegionKey) : "all",
    schoolCount: number(source.schoolCount ?? source.school_count),
    opportunity: number(source.opportunity),
    leads: number(source.leads),
    conversion: number(source.conversion),
    competition: number(source.competition),
    revenue: number(source.revenue),
    grade12Population: number(source.grade12Population),
    penetrationRate: number(source.penetrationRate),
    trend: number(source.trend),
    recommendation: text(source.recommendation),
    keyAction: text(source.keyAction),
    highSchools: schools
      .map((school, index) => normalizeSchool(school, `${code}-school-${index}`))
      .filter((item): item is DirectorMarketSchool => item !== null),
  };
}

function normalizeRegionSummary(value: unknown): DirectorMarketRegionSummary | null {
  const source = record(value);
  const scope = text(source.scope);
  const count = number(source.count);
  if (!scope || !regions.has(scope) || count === null) return null;

  return {
    scope: scope as MarketRegionKey,
    count,
    totalGrade12: number(source.totalGrade12 ?? source.total_grade12),
    totalLeads: number(source.totalLeads ?? source.total_leads),
    avgConversion: number(source.avgConversion ?? source.avg_conversion),
    hotspotCount: number(source.hotspotCount ?? source.hotspot_count),
    totalRevenue: number(source.totalRevenue ?? source.total_revenue),
    grade12Trend: number(source.grade12Trend ?? source.grade12_trend),
    leadsTrend: number(source.leadsTrend ?? source.leads_trend),
    revenueTrend: number(source.revenueTrend ?? source.revenue_trend),
  };
}

function normalizeMetricConfig(value: unknown): DirectorMarketMetricConfig | null {
  const source = record(value);
  const key = text(source.key);
  if (!key || !metrics.has(key)) return null;

  return {
    key: key as DirectorMarketMetricConfig["key"],
    label: text(source.label) ?? key,
    unit: text(source.unit) ?? "",
    min: number(source.min),
    max: number(source.max),
  };
}

function normalizeMeta(value: unknown): DirectorMarketMeta | null {
  const source = record(value);
  const admissionYear = number(source.admissionYear ?? source.admission_year);
  const period = text(source.period);
  const region = text(source.region);
  const metric = text(source.metric);
  const asOf = text(source.asOf ?? source.as_of);
  const scope = text(source.scope);
  const sourceDataRevision = text(source.sourceDataRevision ?? source.source_data_revision);

  if (
    admissionYear === null ||
    period !== "30d" ||
    !region ||
    !regions.has(region) ||
    !metric ||
    !metrics.has(metric) ||
    !asOf ||
    scope !== "director" ||
    !sourceDataRevision
  ) {
    return null;
  }

  return {
    admissionYear,
    period,
    region: region as MarketRegionKey,
    metric: metric as DirectorMarketMeta["metric"],
    asOf,
    scope,
    sourceDataRevision,
  };
}

export function normalizeMarketOverview(value: unknown): DirectorMarketOverview {
  const root = record(value);
  const data = record(root.data && !Array.isArray(root.data) ? root.data : root);
  const meta = record(root.meta);
  const provinces = Array.isArray(data.provinces) ? data.provinces : [];
  const normalizedAvailability = availability(root.dataAvailability ?? data.dataAvailability);
  const normalizedMeta = normalizeMeta(root.meta);

  return {
    provinces: provinces.map(normalizeProvince).filter((item): item is DirectorMarketProvince => item !== null),
    totalProvinces: number(data.totalProvinces),
    totalSchools: number(data.totalSchools),
    admissionYear: number(meta.admissionYear ?? data.admissionYear),
    asOf: text(meta.asOf ?? data.asOf),
    regionSummary: normalizeRegionSummary(data.regionSummary ?? root.regionSummary),
    metricConfig: normalizeMetricConfig(data.metricConfig ?? root.metricConfig),
    metricAvailability: metricAvailability(data.dataAvailability ?? root.metricAvailability),
    meta: normalizedMeta,
    dataAvailability: {
      ...normalizedAvailability,
      status: statuses.has(String(root.status))
        ? (root.status as DataAvailability["status"])
        : normalizedAvailability.status,
    },
  };
}

export function averageAvailable(values: Array<number | null>): number | null {
  const available = values.filter((value): value is number => value !== null);
  if (!available.length) return null;
  return available.reduce((sum, value) => sum + value, 0) / available.length;
}

export function sumAvailable(values: Array<number | null>): number | null {
  const available = values.filter((value): value is number => value !== null);
  return available.length ? available.reduce((sum, value) => sum + value, 0) : null;
}

export function sortByAvailableScore<T, K extends keyof T>(rows: T[], key: K): T[] {
  return [...rows].sort((left, right) => {
    const leftValue = typeof left[key] === "number" ? (left[key] as number) : null;
    const rightValue = typeof right[key] === "number" ? (right[key] as number) : null;
    if (leftValue === null) return rightValue === null ? 0 : 1;
    if (rightValue === null) return -1;
    return rightValue - leftValue;
  });
}
