export type RevenueForecastResponse = {
  meta: {
    admissionYear: number;
    scopeLabel: string;
    status: string;
    warnings: string[];
  };
  summary: {
    forecastRevenue: number;
    actualRevenue: number;
    revenueTarget: number;
    forecastEnrollment: number;
    enrollmentTarget: number;
    revenueGap: number;
    modelConfidence: number | null;
    changeVsPrevious: number | null;
  };
  forecast: {
    points: Array<{
      label: string;
      actual: number | null;
      forecast: number | null;
      target: number | null;
    }>;
  };
  model: {
    grossRevenue: number;
    scholarship: number;
    discount: number;
    netRevenue: number;
  };
  regions: Array<{
    id: string;
    label: string;
    actual: number | null;
    forecast: number | null;
    share: number | null;
  }>;
  targetPlan: Array<{
    id: string;
    label: string;
    actual: number;
    target: number;
    progress: number | null;
  }>;
  signals: {
    positive: string[];
    negative: string[];
    primaryRisk: string | null;
  };
  collectionHealth: {
    status: "stable" | "watch" | "critical";
    onTimeRate: number | null;
    reconciledCount: number;
    transactionCount: number;
    outstandingAmount: number;
    processingOnTimeRate: number | null;
    warnings: string[];
  };
  transactions: Array<{
    id: string;
    title: string;
    occurredAt: string;
    amount: number;
    direction: "income" | "expense";
    status: string;
    reconciled: boolean;
  }>;
  activities: Array<{
    id: string;
    title: string;
    occurredAt: string;
    status: string;
  }>;
  channelMix: {
    totalLeads: number;
    items: Array<{ id: string; label: string; share: number }>;
    topChannelId: string | null;
  };
  cashflow: {
    points: Array<{ label: string; gross: number; reductions: number }>;
    grossTotal: number;
    reductionTotal: number;
    netTotal: number;
    changeVsPrevious: number | null;
  };
  decisions: Array<{
    id: string;
    title: string;
    impact: number | null;
    status: string;
  }>;
  scenarioSimulation: {
    targetRevenue: number;
    defaultScenarioId: string;
    scenarios: Array<{ id: string; label: string; revenue: number }>;
  };
  aiExplanation: {
    confidence: number | null;
    conclusion: { title: string; description: string };
    expectedEnrollment: number;
    drivers: string[];
    primaryRisk: string | null;
  };
};
