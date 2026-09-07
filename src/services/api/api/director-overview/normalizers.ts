import type {
  AdmissionsPipeline,
  AdmissionsTrend,
  DirectorBriefing,
  DirectorKpi,
  DirectorOverviewResponse,
  EnrollmentForecast,
  MarketOverviewItem,
  MetricTone,
  PipelineStage,
  SourcePerformance,
  TrendRange,
  WeeklyActivity,
} from "./types";
import {
  initialAdmissionsTrend,
  initialDirectorBriefing,
  initialDirectorKpis,
  initialEnrollmentForecast,
  initialMarketOverview,
  initialPipelineStages,
  initialSourcePerformance,
  initialWeeklyActivity,
} from "./data";

const SENTINEL_STRINGS = new Set(["null", "undefined", "-", "—", "–", "n/a"]);

function isSentinelString(str: string): boolean {
  return str.toLowerCase().includes("nan") || SENTINEL_STRINGS.has(str.toLowerCase());
}

export function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (!value) return fallback;
  const str = String(value).trim();
  if (isSentinelString(str)) return fallback;
  const cleaned = str.replace(/[^\d.-]/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : fallback;
}

export function safePercentNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (!value) return fallback;
  const str = String(value).trim();
  if (isSentinelString(str)) return fallback;
  const cleaned = str.replace("%", "").replace(",", ".").replace("+", "").trim();
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : fallback;
}

export function safePercentString(value: unknown, fallback = "0%"): string {
  if (value === null || value === undefined || value === "") return fallback;
  const str = String(value).trim();
  if (isSentinelString(str)) return fallback;
  const num = safePercentNumber(str);
  return `${num.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`;
}

export function safeGrowthString(value: unknown, fallback = "0%"): string {
  if (value === null || value === undefined || value === "") return fallback;
  const str = String(value).trim();
  if (isSentinelString(str)) return fallback;
  const num = safePercentNumber(str);
  const prefix = num > 0 ? "+" : "";
  return `${prefix}${num.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`;
}

export function safeFormattedNumber(value: unknown): string {
  return safeNumber(value).toLocaleString("vi-VN");
}

function normalizeKpis(rawKpis: unknown): DirectorKpi[] {
  if (!Array.isArray(rawKpis) || rawKpis.length === 0) return initialDirectorKpis;
  return rawKpis.map((kpi) => {
    const item = typeof kpi === "object" && kpi !== null ? (kpi as Record<string, unknown>) : {};
    return {
      id: String(item.id ?? ""),
      label: String(item.label ?? ""),
      value: String(item.value ?? "-"),
      target: String(item.target ?? "-"),
      achievement: safePercentString(item.achievement, "-"),
      change: safeGrowthString(item.change, "-"),
      helper: String(item.helper ?? ""),
      tone: (item.tone as MetricTone) ?? "primary",
    };
  });
}

function normalizeForecast(rawForecast: unknown): EnrollmentForecast {
  const fallback = initialEnrollmentForecast;
  if (!rawForecast || typeof rawForecast !== "object") return fallback;
  const obj = rawForecast as Record<string, unknown>;
  const rawSummary = obj.summary && typeof obj.summary === "object" ? (obj.summary as Record<string, unknown>) : {};
  const rawPoints = Array.isArray(obj.points) ? obj.points : fallback.points;

  const actual = safeNumber(rawSummary.actual, fallback.summary.actual);
  const forecast = safeNumber(rawSummary.forecast, fallback.summary.forecast);
  const target = safeNumber(rawSummary.target, fallback.summary.target);
  const confidence = safeNumber(rawSummary.confidence, fallback.summary.confidence);
  const gapToTarget = safeNumber(rawSummary.gapToTarget, Math.max(0, target - actual));

  const points = rawPoints.map((pt) => {
    const ptObj = typeof pt === "object" && pt !== null ? (pt as Record<string, unknown>) : {};
    return {
      label: String(ptObj.label ?? ""),
      actual: ptObj.actual === null || ptObj.actual === undefined ? null : safeNumber(ptObj.actual),
      forecast: safeNumber(ptObj.forecast, 0),
      target: safeNumber(ptObj.target, 0),
    };
  });

  return {
    summary: {
      actual,
      forecast,
      target,
      confidence,
      gapToTarget,
    },
    points,
  };
}

function normalizeBriefing(rawBriefing: unknown): DirectorBriefing {
  const fallback = initialDirectorBriefing;
  if (!rawBriefing || typeof rawBriefing !== "object") return fallback;
  const obj = rawBriefing as Record<string, unknown>;
  const rawAlert = obj.alert && typeof obj.alert === "object" ? (obj.alert as Record<string, unknown>) : {};
  const rawAction = obj.priorityAction && typeof obj.priorityAction === "object" ? (obj.priorityAction as Record<string, unknown>) : {};

  return {
    alert: {
      id: String(rawAlert.id ?? fallback.alert.id),
      type: (rawAlert.type as "risk" | "opportunity" | "revenue") ?? fallback.alert.type,
      title: String(rawAlert.title ?? fallback.alert.title),
      description: String(rawAlert.description ?? fallback.alert.description),
      evidence: String(rawAlert.evidence ?? fallback.alert.evidence),
      metric: String(rawAlert.metric ?? fallback.alert.metric),
      href: String(rawAlert.href ?? fallback.alert.href),
    },
    priorityAction: {
      id: String(rawAction.id ?? fallback.priorityAction.id),
      title: String(rawAction.title ?? fallback.priorityAction.title),
      description: String(rawAction.description ?? fallback.priorityAction.description),
      impact: String(rawAction.impact ?? fallback.priorityAction.impact),
      href: String(rawAction.href ?? fallback.priorityAction.href),
    },
  };
}

function normalizePipeline(rawPipeline: unknown): AdmissionsPipeline {
  if (!rawPipeline || typeof rawPipeline !== "object") {
    return {
      stages: initialPipelineStages,
      summary: { prospects: 0, accepted: 0, enrolled: 0, enrollmentRate: 0 },
      biggestDrop: { fromStageId: "", fromLabel: "", toStageId: "", toLabel: "", differencePoints: 0 },
    };
  }

  const obj = rawPipeline as Record<string, unknown>;
  const rawStages = Array.isArray(obj.stages) ? obj.stages : initialPipelineStages;
  const rawSummary = obj.summary && typeof obj.summary === "object" ? (obj.summary as Record<string, unknown>) : {};

  const stages: PipelineStage[] = rawStages.map((st) => {
    const stObj = typeof st === "object" && st !== null ? (st as Record<string, unknown>) : {};
    return {
      id: String(stObj.id ?? ""),
      label: String(stObj.label ?? ""),
      value: typeof stObj.value === "number" ? safeFormattedNumber(stObj.value) : String(stObj.value ?? "-"),
      percentage: safePercentNumber(stObj.percentage, 0),
      conversion: safePercentString(stObj.conversion, "-"),
    };
  });

  const prospects = safeNumber(rawSummary.prospects, safeNumber(stages[0]?.value, 0));
  const accepted = safeNumber(rawSummary.accepted, safeNumber(stages.find((s) => s.id === "accepted")?.value, 0));
  const enrolled = safeNumber(rawSummary.enrolled, safeNumber(stages.find((s) => s.id === "enrolled")?.value, 0));
  const enrollmentRate = safePercentNumber(
    rawSummary.enrollmentRate,
    prospects > 0 ? (enrolled / prospects) * 100 : 0,
  );

  let biggestDrop = {
    fromStageId: stages[0]?.id ?? "prospect",
    fromLabel: stages[0]?.label ?? "Hồ sơ tiềm năng",
    toStageId: stages[1]?.id ?? "engaged",
    toLabel: stages[1]?.label ?? "Đã tương tác",
    differencePoints: (stages[0]?.percentage ?? 100) - (stages[1]?.percentage ?? 76),
  };

  for (let i = 1; i < stages.length; i++) {
    const prev = stages[i - 1];
    const curr = stages[i];
    const diff = prev.percentage - curr.percentage;
    if (diff > biggestDrop.differencePoints) {
      biggestDrop = {
        fromStageId: prev.id,
        fromLabel: prev.label,
        toStageId: curr.id,
        toLabel: curr.label,
        differencePoints: diff,
      };
    }
  }

  return {
    stages,
    summary: {
      prospects,
      accepted,
      enrolled,
      enrollmentRate,
    },
    biggestDrop,
  };
}

function normalizeTrend(rawTrend: unknown): AdmissionsTrend {
  const fallback = initialAdmissionsTrend;
  if (!rawTrend || typeof rawTrend !== "object") return fallback;
  const obj = rawTrend as Record<string, unknown>;
  const rawRanges = obj.ranges && typeof obj.ranges === "object" ? (obj.ranges as Record<string, unknown>) : {};

  const normalizeRangeData = (rangeKey: TrendRange) => {
    const rangeObj = rawRanges[rangeKey] && typeof rawRanges[rangeKey] === "object"
      ? (rawRanges[rangeKey] as Record<string, unknown>)
      : null;
    const fbRange = fallback.ranges[rangeKey];
    if (!rangeObj) return fbRange;

    const points = (Array.isArray(rangeObj.points) ? rangeObj.points : fbRange.points).map((pt) => {
      const ptObj = typeof pt === "object" && pt !== null ? (pt as Record<string, unknown>) : {};
      return {
        label: String(ptObj.label ?? ""),
        newLeads: safeNumber(ptObj.newLeads),
        applicants: safeNumber(ptObj.applicants),
        enrolled: safeNumber(ptObj.enrolled),
      };
    });

    const rawTotals = rangeObj.totals && typeof rangeObj.totals === "object"
      ? (rangeObj.totals as Record<string, unknown>)
      : null;

    const totals = rawTotals
      ? {
          newLeads: safeNumber(rawTotals.newLeads),
          applicants: safeNumber(rawTotals.applicants),
          enrolled: safeNumber(rawTotals.enrolled),
        }
      : {
          newLeads: points.reduce((acc, p) => acc + p.newLeads, 0),
          applicants: points.reduce((acc, p) => acc + p.applicants, 0),
          enrolled: points.reduce((acc, p) => acc + p.enrolled, 0),
        };

    return { points, totals };
  };

  return {
    defaultRange: (obj.defaultRange as TrendRange) ?? fallback.defaultRange,
    ranges: {
      "7d": normalizeRangeData("7d"),
      "30d": normalizeRangeData("30d"),
      year: normalizeRangeData("year"),
    },
  };
}

function normalizeMarketOverview(rawMarket: unknown): MarketOverviewItem[] {
  if (!Array.isArray(rawMarket) || rawMarket.length === 0) return initialMarketOverview;

  return rawMarket.map((item) => {
    const obj = typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {};

    const prospectsNum = safeNumber(obj.prospects);
    const enrolledNum = safeNumber(obj.enrolled);

    // If conversion is NaN% or null, compute from enrolled / prospects if possible
    let conversionStr = safePercentString(obj.conversion, "");
    if (!conversionStr || conversionStr === "0%" || String(obj.conversion).toLowerCase().includes("nan")) {
      if (prospectsNum > 0) {
        const rate = (enrolledNum / prospectsNum) * 100;
        conversionStr = `${rate.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`;
      } else {
        conversionStr = "0%";
      }
    }

    // If growth is NaN% or null, fallback to 0%
    const growthStr = safeGrowthString(obj.growth, "0%");
    const coverageNum = safeNumber(obj.coverage, 0);

    return {
      id: String(obj.id ?? ""),
      name: String(obj.name ?? ""),
      prospects: obj.prospects === null || obj.prospects === undefined
        ? "-"
        : safeFormattedNumber(obj.prospects),
      enrolled: obj.enrolled === null || obj.enrolled === undefined
        ? "-"
        : safeFormattedNumber(obj.enrolled),
      conversion: conversionStr,
      growth: growthStr,
      coverage: coverageNum,
      tone: (obj.tone as MetricTone) ?? "primary",
    };
  });
}

function normalizeSourcePerformance(rawSources: unknown): SourcePerformance[] {
  if (!Array.isArray(rawSources) || rawSources.length === 0) return initialSourcePerformance;

  return rawSources.map((item) => {
    const obj = typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {};

    return {
      id: String(obj.id ?? ""),
      label: String(obj.label ?? ""),
      leads: obj.leads === null || obj.leads === undefined ? "-" : safeFormattedNumber(obj.leads),
      applicants: obj.applicants === null || obj.applicants === undefined
        ? "-"
        : safeFormattedNumber(obj.applicants),
      enrolled: obj.enrolled === null || obj.enrolled === undefined
        ? "-"
        : safeFormattedNumber(obj.enrolled),
      share: safePercentNumber(obj.share, 0),
    };
  });
}

function normalizeWeeklyActivity(rawActivity: unknown): WeeklyActivity {
  const fallback = initialWeeklyActivity;
  if (!rawActivity || typeof rawActivity !== "object") return fallback;
  const obj = rawActivity as Record<string, unknown>;
  const rawPoints = Array.isArray(obj.points) ? obj.points : fallback.points;

  const points = rawPoints.map((pt) => {
    const ptObj = typeof pt === "object" && pt !== null ? (pt as Record<string, unknown>) : {};
    return {
      label: String(ptObj.label ?? ""),
      interactions: safeNumber(ptObj.interactions, 0),
      sla: safeNumber(ptObj.sla, 0),
    };
  });

  const totalInteractions = safeNumber(
    obj.totalInteractions,
    points.reduce((acc, p) => acc + p.interactions, 0),
  );
  const averageSla = safePercentNumber(
    obj.averageSla,
    points.length > 0 ? points.reduce((acc, p) => acc + p.sla, 0) / points.length : 0,
  );
  const changePercent = safePercentNumber(obj.changePercent, 0);

  return {
    points,
    totalInteractions,
    averageSla,
    changePercent,
  };
}

export function normalizeDirectorOverview(value: unknown): DirectorOverviewResponse {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid payload: expected an object");
  }

  const raw = "message" in value && value.message && typeof value.message === "object"
    ? (value as { message: Record<string, unknown> }).message
    : (value as Record<string, unknown>);

  const metaObj = raw.meta && typeof raw.meta === "object" ? (raw.meta as Record<string, unknown>) : {};

  return {
    meta: {
      admissionYear: safeNumber(metaObj.admissionYear, 2026),
      scope: String(metaObj.scope ?? "all"),
      scopeLabel: String(metaObj.scopeLabel ?? "Toàn bộ cơ sở"),
      asOf: String(metaObj.asOf ?? new Date().toISOString()),
      freshnessLabel: metaObj.freshnessLabel ? String(metaObj.freshnessLabel) : "Dữ liệu cập nhật vừa xong",
      timezone: String(metaObj.timezone ?? "Asia/Ho_Chi_Minh"),
    },
    kpis: normalizeKpis(raw.kpis),
    forecast: normalizeForecast(raw.forecast),
    briefing: normalizeBriefing(raw.briefing),
    pipeline: normalizePipeline(raw.pipeline),
    admissionsTrend: normalizeTrend(raw.admissionsTrend),
    marketOverview: normalizeMarketOverview(raw.marketOverview),
    sourcePerformance: normalizeSourcePerformance(raw.sourcePerformance),
    weeklyActivity: normalizeWeeklyActivity(raw.weeklyActivity),
  };
}
