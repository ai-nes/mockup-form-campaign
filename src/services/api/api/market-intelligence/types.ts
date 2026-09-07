export type AvailabilityStatus = "available" | "partial" | "unavailable";

export interface DataAvailability {
  status?: AvailabilityStatus;
  sections: Record<string, AvailabilityStatus>;
  fields: Record<string, AvailabilityStatus>;
}

export interface MarketMetricAvailability {
  opportunity: AvailabilityStatus;
  competition: AvailabilityStatus;
  revenue: AvailabilityStatus;
  grade12Population: AvailabilityStatus;
}

export interface DirectorMarketRegionSummary {
  scope: MarketRegionKey;
  count: number;
  totalGrade12: number | null;
  totalLeads: number | null;
  avgConversion: number | null;
  hotspotCount: number | null;
  totalRevenue: number | null;
  grade12Trend: number | null;
  leadsTrend: number | null;
  revenueTrend: number | null;
}

export interface DirectorMarketMetricConfig {
  key: NonNullable<DirectorMarketParams["metric"]>;
  label: string;
  unit: string;
  min: number | null;
  max: number | null;
}

export interface DirectorMarketMeta {
  admissionYear: number;
  period: "30d";
  region: MarketRegionKey;
  metric: NonNullable<DirectorMarketParams["metric"]>;
  asOf: string;
  scope: "director";
  sourceDataRevision: string;
}

export type MarketRegionKey = "all" | "north" | "central" | "highlands" | "south" | "mekong";
export type MarketSchoolClassification = "Trọng điểm" | "Mở rộng" | "Duy trì" | "Sàng lọc" | null;

export interface MarketSchoolCoordinates {
  latitude: number;
  longitude: number;
}

export type MarketSchoolParticipationType = "event" | "campaign";

/** A field event or campaign that a school has taken part in. */
export interface MarketSchoolParticipation {
  id: string;
  name: string;
  type: MarketSchoolParticipationType;
  occurredAt: string | null;
}

export interface DirectorMarketSchool {
  id: string;
  directoryId: string | null;
  name: string;
  district: string | null;
  coordinates: MarketSchoolCoordinates | null;
  tier: "Tier 1" | "Tier 2" | "Tier 3" | null;
  potentialScore: number | null;
  grade12Students: number | null;
  prospects: number | null;
  penetrationRate: number | null;
  applications: number | null;
  enrollmentForecast: number | null;
  conversionRate: number | null;
  lastActivity: string | null;
  recommendation: string | null;
  nextAction: string | null;
  classification: MarketSchoolClassification;
  participations: MarketSchoolParticipation[];
}

export interface DirectorMarketProvince {
  code: string;
  name: string;
  fullName: string | null;
  regionKey: MarketRegionKey;
  schoolCount: number | null;
  opportunity: number | null;
  leads: number | null;
  conversion: number | null;
  competition: number | null;
  revenue: number | null;
  grade12Population: number | null;
  penetrationRate: number | null;
  trend: number | null;
  recommendation: string | null;
  keyAction: string | null;
  highSchools: DirectorMarketSchool[];
}

export interface DirectorMarketOverview {
  provinces: DirectorMarketProvince[];
  totalProvinces: number | null;
  totalSchools: number | null;
  admissionYear: number | null;
  asOf: string | null;
  regionSummary: DirectorMarketRegionSummary | null;
  metricConfig: DirectorMarketMetricConfig | null;
  metricAvailability: MarketMetricAvailability;
  meta: DirectorMarketMeta | null;
  dataAvailability: DataAvailability;
}

export interface DirectorMarketParams {
  admissionYear?: number;
  period?: "30d";
  region?: MarketRegionKey;
  metric?: "opportunity" | "leads" | "conversion" | "competition" | "revenue";
  includeSchools?: boolean;
  schoolLimit?: number;
}
