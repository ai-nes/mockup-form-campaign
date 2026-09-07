export type AttributionConfidence = "high" | "medium" | "low";
export type CampaignHealth = "on_track" | "watch" | "reallocate";

export type LeadStatusGroup = "new" | "in_progress" | "no_response" | "disqualified" | "converted";
export type LeadQualityGroup = "invalid" | "duplicate" | "unknown";
export type LeadStatusFilter = LeadStatusGroup | LeadQualityGroup | "all";

export interface LeadStatusBreakdown {
  code: LeadStatusGroup;
  label: string;
  count: number;
  share: number;
}

export interface CampaignScopeParams {
  admissionYear?: number;
  from?: string;
  to?: string;
  granularity?: string;
  channel?: string;
  campus?: string;
  scope?: string;
}

export interface CampaignLeadsParams extends CampaignScopeParams {
  campaignId: string;
  statusGroup?: LeadStatusFilter;
  page: number;
  pageSize: number;
}

export interface CampaignLead {
  id?: string;
  leadCode: string;
  name: string;
  school: string;
  status: string;
  statusCode: string;
  owner: string;
  source: string;
  statusGroup: LeadStatusFilter;
  contactAttemptCount: number | null;
  lastContactAt: string | null;
  modifiedAt: string | null;
}

export interface CampaignLeadsResponse {
  meta: Record<string, unknown>;
  campaignId: string;
  items: CampaignLead[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CampaignRecord {
  id: string;
  name: string;
  channel: string;
  // Null means the backend has not supplied the new aggregate contract yet.
  leadCount: number | null;
  statusBreakdown: LeadStatusBreakdown[] | null;
  qualityCount: number | null;
  spend: number;
  qualifiedLeads: number;
  applications: number;
  enrollments: number;
  confirmedRevenue: number;
  pipelineRevenue: number;
  roas: number;
  cpql: number;
  enrollmentRate: number;
  attributionConfidence: AttributionConfidence;
  health: CampaignHealth;
}

export interface CampaignIntelligenceResponse {
  generatedAt: string;
  summary: {
    spend: number;
    qualifiedLeads: number;
    applications: number;
    enrollments: number;
    confirmedRevenue: number;
    roas: number;
  };
  trend: Array<{ label: string; spend: number; confirmedRevenue: number }>;
  funnel: Array<{ label: string; count: number; conversionRate?: number }>;
  campaigns: CampaignRecord[];
  recommendation: {
    title: string;
    impact: number;
    confidence: AttributionConfidence;
    evidence: string[];
  };
}
