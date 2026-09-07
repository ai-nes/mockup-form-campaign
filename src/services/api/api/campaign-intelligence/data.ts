import type { CampaignIntelligenceResponse } from "./types";

export const campaignIntelligenceMock: CampaignIntelligenceResponse = {
  generatedAt: "",
  summary: {
    spend: 0,
    qualifiedLeads: 0,
    applications: 0,
    enrollments: 0,
    confirmedRevenue: 0,
    roas: 0,
  },
  trend: [],
  funnel: [],
  campaigns: [],
  recommendation: {
    title: "",
    impact: 0,
    confidence: "low",
    evidence: [],
  },
};
