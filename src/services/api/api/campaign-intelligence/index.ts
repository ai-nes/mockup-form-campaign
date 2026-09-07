import type {
  CampaignIntelligenceResponse,
  CampaignRecord,
  CampaignScopeParams,
  CampaignLeadsParams,
  CampaignLeadsResponse,
  LeadStatusBreakdown,
  LeadStatusFilter,
} from "./types";

const METHOD =
  "crm.api.director_campaign_intelligence.get_director_campaign_intelligence";

export type * from "./types";

export class CampaignIntelligenceApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "CampaignIntelligenceApiError";
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function textValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function displayChannel(value: unknown): string {
  const channel = textValue(value);
  const normalized = channel.toLowerCase();
  if (normalized.includes("facebook")) return "Facebook";
  if (normalized.includes("google")) return "Google";
  if (normalized.includes("tiktok")) return "TikTok";
  if (normalized.includes("zalo")) return "Zalo";
  return channel;
}

function getError(payload: unknown): { code?: string; message?: string } {
  const root = asRecord(payload);
  const error =
    asRecord(root?.error) ?? asRecord(asRecord(root?.message)?.error);
  return {
    code: typeof error?.code === "string" ? error.code : undefined,
    message:
      typeof error?.message === "string"
        ? error.message
        : typeof root?.message === "string"
          ? root.message
          : undefined,
  };
}

function normalizeCampaign(row: unknown): CampaignRecord | null {
  const value = asRecord(row);
  if (
    !value ||
    !textValue(value.id) ||
    !textValue(value.name) ||
    !textValue(value.channel)
  )
    return null;
  const health = value.health;
  const confidence = value.attributionConfidence;
  if (
    !["on_track", "watch", "reallocate"].includes(String(health)) ||
    !["high", "medium", "low"].includes(String(confidence))
  )
    return null;
  const leadCount = value.leadCount == null ? null : value.leadCount;
  if (leadCount !== null && (!Number.isInteger(leadCount) || Number(leadCount) < 0)) return null;
  let statusBreakdown: LeadStatusBreakdown[] | null = null;
  if (value.statusBreakdown != null) {
    if (!Array.isArray(value.statusBreakdown)) return null;
    const seen = new Set<string>();
    statusBreakdown = [];
    for (const row of value.statusBreakdown) {
      const item = asRecord(row);
      const code = textValue(item?.code);
      if (!item || !["new", "in_progress", "no_response", "disqualified", "converted"].includes(code)
        || seen.has(code) || !Number.isInteger(item.count) || Number(item.count) < 0
        || typeof item.share !== "number" || !Number.isFinite(item.share) || item.share < 0) return null;
      seen.add(code);
      statusBreakdown.push({ code: code as LeadStatusBreakdown["code"], label: textValue(item.label), count: Number(item.count), share: item.share });
    }
    if (leadCount === null || statusBreakdown.reduce((sum, item) => sum + item.count, 0) > Number(leadCount)) return null;
  }
  return {
    id: textValue(value.id),
    name: textValue(value.name),
    channel: displayChannel(value.channel),
    leadCount: leadCount === null ? null : Number(leadCount),
    statusBreakdown,
    qualityCount:
      value.qualityCount == null
        ? null
        : Number.isInteger(value.qualityCount) && Number(value.qualityCount) >= 0
          ? Number(value.qualityCount)
          : null,
    spend: numberValue(value.spend),
    qualifiedLeads: numberValue(value.qualifiedLeads),
    applications: numberValue(value.applications),
    enrollments: numberValue(value.enrollments),
    confirmedRevenue: numberValue(value.confirmedRevenue),
    pipelineRevenue: numberValue(value.pipelineRevenue),
    roas: numberValue(value.roas),
    cpql: numberValue(value.cpql),
    enrollmentRate: numberValue(value.enrollmentRate),
    attributionConfidence:
      confidence as CampaignRecord["attributionConfidence"],
    health: health as CampaignRecord["health"],
  };
}

function normalizeResponse(
  value: unknown,
): CampaignIntelligenceResponse | null {
  const data = asRecord(value);
  const summary = asRecord(data?.summary);
  const recommendation = asRecord(data?.recommendation);
  if (
    !data ||
    !summary ||
    !recommendation ||
    !Array.isArray(data.trend) ||
    !Array.isArray(data.funnel) ||
    !Array.isArray(data.campaigns)
  )
    return null;
  const campaigns = data.campaigns
    .map(normalizeCampaign)
    .filter((row): row is CampaignRecord => row !== null);
  if (campaigns.length !== data.campaigns.length) return null;
  return {
    generatedAt: textValue(data.generatedAt),
    summary: {
      spend: numberValue(summary.spend),
      qualifiedLeads: numberValue(summary.qualifiedLeads),
      applications: numberValue(summary.applications),
      enrollments: numberValue(summary.enrollments),
      confirmedRevenue: numberValue(summary.confirmedRevenue),
      roas: numberValue(summary.roas),
    },
    trend: data.trend.map((row) => {
      const item = asRecord(row);
      return {
        label: textValue(item?.label),
        spend: numberValue(item?.spend),
        confirmedRevenue: numberValue(item?.confirmedRevenue),
      };
    }),
    funnel: data.funnel.map((row) => {
      const item = asRecord(row);
      return {
        label: textValue(item?.label),
        count: numberValue(item?.value),
        ...(typeof item?.rate === "number" && Number.isFinite(item.rate)
          ? { conversionRate: item.rate }
          : {}),
      };
    }),
    campaigns,
    recommendation: {
      title: textValue(recommendation.title),
      impact: numberValue(recommendation.impact),
      confidence: ["high", "medium", "low"].includes(
        String(recommendation.confidence),
      )
        ? (recommendation.confidence as CampaignRecord["attributionConfidence"])
        : "low",
      evidence: Array.isArray(recommendation.evidence)
        ? recommendation.evidence.filter(
            (item): item is string => typeof item === "string",
          )
        : [],
    },
  };
}

async function requestCampaignData(method: string, params: CampaignScopeParams | CampaignLeadsParams, signal?: AbortSignal): Promise<unknown> {
  const baseUrl = (process.env.NEXT_PUBLIC_FRAPPE_URL ?? "").replace(
    /\/+$/,
    "",
  );
  if (!baseUrl)
    throw new CampaignIntelligenceApiError(
      0,
      "FRAPPE_URL_MISSING",
      "Chưa cấu hình địa chỉ Frappe CRM API.",
    );
  let response: Response;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const suffix = query.size ? `?${query}` : "";
  try {
    response = await fetch(`${baseUrl}/api/method/${method}${suffix}`, {
      headers: { Accept: "application/json" },
      credentials: "include",
      cache: "no-store",
      ...(signal ? { signal } : {}),
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new CampaignIntelligenceApiError(
      503,
      "CAMPAIGN_INTELLIGENCE_DATA_UNAVAILABLE",
      "Không thể kết nối tới dữ liệu campaign intelligence.",
    );
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = getError(payload);
    throw new CampaignIntelligenceApiError(
      response.status,
      error.code ?? "CAMPAIGN_INTELLIGENCE_DATA_UNAVAILABLE",
      error.message ?? `Lỗi HTTP ${response.status}: ${response.statusText}`,
    );
  }
  return asRecord(payload)?.message;
}

export async function getCampaignIntelligence(params: CampaignScopeParams = {}, signal?: AbortSignal): Promise<CampaignIntelligenceResponse> {
  const data = normalizeResponse(await requestCampaignData(METHOD, params, signal));
  if (!data)
    throw new CampaignIntelligenceApiError(
      502,
      "INVALID_CAMPAIGN_RESPONSE",
      "Phản hồi campaign intelligence không hợp lệ.",
    );
  return data;
}

export async function getCampaignLeads(params: CampaignLeadsParams, signal?: AbortSignal): Promise<CampaignLeadsResponse> {
  const data = asRecord(await requestCampaignData("crm.api.director_campaign_intelligence.get_campaign_leads", params, signal));
  const invalid = () => new CampaignIntelligenceApiError(502, "INVALID_CAMPAIGN_LEADS_RESPONSE", "Phản hồi danh sách lead không hợp lệ.");
  const meta = asRecord(data?.meta);
  const pagination = asRecord(data?.pagination);
  const page = pagination?.page;
  const pageSize = pagination?.pageSize;
  const total = pagination?.total;
  const totalPages = pagination?.totalPages;
  if (!data || !meta || !textValue(data.campaignId) || !pagination || !Array.isArray(data.items)
    || !Number.isInteger(page) || Number(page) < 1 || !Number.isInteger(pageSize) || Number(pageSize) < 1
    || !Number.isInteger(total) || Number(total) < 0 || !Number.isInteger(totalPages) || Number(totalPages) < 0) throw invalid();
  const leads = data.items.map((row) => {
    const item = asRecord(row);
    if (!item || !textValue(item.leadCode) || !textValue(item.name)) throw invalid();
    if (item.contactAttemptCount != null && (!Number.isInteger(item.contactAttemptCount) || Number(item.contactAttemptCount) < 0)) throw invalid();
    const statusGroup = textValue(item.statusGroup, "unknown") as LeadStatusFilter;
    if (!["all", "new", "in_progress", "no_response", "disqualified", "converted", "invalid", "duplicate", "unknown"].includes(statusGroup)) throw invalid();
    return {
      ...(textValue(item.id) ? { id: textValue(item.id) } : {}),
      leadCode: textValue(item.leadCode), name: textValue(item.name), school: textValue(item.school),
      status: textValue(item.status), statusCode: textValue(item.statusCode), owner: textValue(item.owner),
      source: textValue(item.source), modifiedAt: item.modifiedAt == null ? null : textValue(item.modifiedAt),
      statusGroup,
      lastContactAt: item.lastContactAt == null ? null : textValue(item.lastContactAt),
      contactAttemptCount: item.contactAttemptCount == null ? null : Number(item.contactAttemptCount),
    };
  });
  if (leads.length > Number(pageSize) || leads.length > Number(total) || Number(page) > Number(totalPages || 1)) throw invalid();
  return {
    meta,
    campaignId: textValue(data.campaignId),
    items: leads,
    pagination: {
      page: Number(page),
      pageSize: Number(pageSize),
      total: Number(total),
      totalPages: Number(totalPages),
    },
  };
}
