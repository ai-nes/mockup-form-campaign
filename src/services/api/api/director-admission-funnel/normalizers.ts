import {
  FUNNEL_STAGE_IDS,
  type DirectorAdmissionFunnelData,
  type FunnelAgingStageId,
  type FunnelPriorityTone,
  type FunnelStageId,
} from "./types";

type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : null;
}

function toNumber(value: unknown, path: string, nullable = false): number | null {
  if (value === null || value === undefined || value === "") {
    if (nullable) return null;
    throw new Error(`${path} must be a number`);
  }

  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) throw new Error(`${path} must be a number`);
  return numberValue;
}

function toStringValue(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${path} must be a string`);
  return value;
}

function toStageId(value: unknown, path: string, nullable = false): FunnelStageId | null {
  if (value === null || value === undefined) {
    if (nullable) return null;
    throw new Error(`${path} must be a valid funnel stage id`);
  }
  if (typeof value !== "string" || !FUNNEL_STAGE_IDS.includes(value as FunnelStageId)) {
    throw new Error(`${path} must be a valid funnel stage id`);
  }
  return value as FunnelStageId;
}

function toArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${path} must be an array`);
  return value;
}

function normalizeStages(value: unknown): DirectorAdmissionFunnelData["stages"] {
  const rawStages = toArray(value, "stages");
  if (rawStages.length !== FUNNEL_STAGE_IDS.length) throw new Error("stages must contain 7 items");

  const stages = rawStages.map((rawStage, index) => {
    const stage = asRecord(rawStage);
    if (!stage) throw new Error(`stages[${index}] must be an object`);
    const id = toStageId(stage.id, `stages[${index}].id`);
    if (id !== FUNNEL_STAGE_IDS[index]) throw new Error("stages must use the canonical order");

    return {
      id,
      label: toStringValue(stage.label, `stages[${index}].label`),
      description: toStringValue(stage.description, `stages[${index}].description`),
      count: toNumber(stage.count, `stages[${index}].count`) as number,
      remainingRate: toNumber(stage.remainingRate, `stages[${index}].remainingRate`) as number,
      stepRate: toNumber(stage.stepRate, `stages[${index}].stepRate`, true),
    };
  });

  return stages;
}

function normalizeDropOffs(value: unknown): DirectorAdmissionFunnelData["dropOffs"] {
  const rawDropOffs = toArray(value, "dropOffs");
  if (rawDropOffs.length !== FUNNEL_STAGE_IDS.length - 1) throw new Error("dropOffs must contain 6 items");

  return rawDropOffs.map((rawDropOff, index) => {
    const dropOff = asRecord(rawDropOff);
    if (!dropOff) throw new Error(`dropOffs[${index}] must be an object`);
    const fromStageId = toStageId(dropOff.fromStageId, `dropOffs[${index}].fromStageId`) as FunnelStageId;
    const toStageIdValue = toStageId(dropOff.toStageId, `dropOffs[${index}].toStageId`) as FunnelStageId;

    return {
      fromStageId,
      toStageId: toStageIdValue,
      fromLabel: toStringValue(dropOff.fromLabel, `dropOffs[${index}].fromLabel`),
      toLabel: toStringValue(dropOff.toLabel, `dropOffs[${index}].toLabel`),
      dropCount: toNumber(dropOff.dropCount, `dropOffs[${index}].dropCount`) as number,
      dropRate: toNumber(dropOff.dropRate, `dropOffs[${index}].dropRate`) as number,
    };
  });
}

function normalizeAging(value: unknown): DirectorAdmissionFunnelData["aging"] {
  const aging = asRecord(value);
  if (!aging) throw new Error("aging must be an object");
  const rawRows = toArray(aging.rows, "aging.rows");
  if (rawRows.length !== FUNNEL_STAGE_IDS.length - 1) throw new Error("aging.rows must contain 6 items");

  const rows = rawRows.map((rawRow, index) => {
    const row = asRecord(rawRow);
    if (!row) throw new Error(`aging.rows[${index}] must be an object`);
    const stageIdValue = toStageId(row.stageId, `aging.rows[${index}].stageId`) as FunnelStageId;
    if (stageIdValue === "enrolled") throw new Error("aging.rows cannot contain enrolled");
    const stageId = stageIdValue as FunnelAgingStageId;

    return {
      stageId,
      stage: toStringValue(row.stage, `aging.rows[${index}].stage`),
      underThreeDays: toNumber(row.underThreeDays, `aging.rows[${index}].underThreeDays`) as number,
      threeToSevenDays: toNumber(row.threeToSevenDays, `aging.rows[${index}].threeToSevenDays`) as number,
      sevenToFourteenDays: toNumber(row.sevenToFourteenDays, `aging.rows[${index}].sevenToFourteenDays`) as number,
      overFourteenDays: toNumber(row.overFourteenDays, `aging.rows[${index}].overFourteenDays`) as number,
      medianDays: toNumber(row.medianDays, `aging.rows[${index}].medianDays`, true),
    };
  });

  return {
    totalOverFourteenDays: toNumber(aging.totalOverFourteenDays, "aging.totalOverFourteenDays") as number,
    rows,
  };
}

function normalizeSourcePerformance(value: unknown): DirectorAdmissionFunnelData["sourcePerformance"] {
  return toArray(value, "sourcePerformance").map((rawSource, index) => {
    const source = asRecord(rawSource);
    if (!source) throw new Error(`sourcePerformance[${index}] must be an object`);
    const stepRates = toArray(source.stepRates, `sourcePerformance[${index}].stepRates`);
    if (stepRates.length !== FUNNEL_STAGE_IDS.length - 1) throw new Error("sourcePerformance.stepRates must contain 6 items");

    return {
      id: toStringValue(source.id, `sourcePerformance[${index}].id`),
      label: toStringValue(source.label, `sourcePerformance[${index}].label`),
      stepRates: stepRates.map((rate, rateIndex) => toNumber(rate, `sourcePerformance[${index}].stepRates[${rateIndex}]`, true)),
      finalRate: toNumber(source.finalRate, `sourcePerformance[${index}].finalRate`, true),
    };
  });
}

function normalizeCohorts(value: unknown): DirectorAdmissionFunnelData["cohorts"] {
  const cohorts = asRecord(value);
  if (!cohorts) throw new Error("cohorts must be an object");
  const followUpWeeks = toArray(cohorts.followUpWeeks, "cohorts.followUpWeeks").map((week, index) =>
    toNumber(week, `cohorts.followUpWeeks[${index}]`) as number,
  );
  const rows = toArray(cohorts.rows, "cohorts.rows").map((rawRow, index) => {
    const row = asRecord(rawRow);
    if (!row) throw new Error(`cohorts.rows[${index}] must be an object`);
    const values = toArray(row.values, `cohorts.rows[${index}].values`);
    if (values.length !== followUpWeeks.length) throw new Error("cohort values must match followUpWeeks");

    return {
      id: toStringValue(row.id, `cohorts.rows[${index}].id`),
      label: toStringValue(row.label, `cohorts.rows[${index}].label`),
      values: values.map((item, valueIndex) => toNumber(item, `cohorts.rows[${index}].values[${valueIndex}]`, true)),
    };
  });

  return {
    targetStageId: toStageId(cohorts.targetStageId, "cohorts.targetStageId") as FunnelStageId,
    followUpWeeks,
    completeCohortCount: toNumber(cohorts.completeCohortCount, "cohorts.completeCohortCount") as number,
    rows,
  };
}

function normalizePriorityActions(value: unknown): DirectorAdmissionFunnelData["priorityActions"] {
  return toArray(value, "priorityActions").map((rawAction, index) => {
    const action = asRecord(rawAction);
    if (!action) throw new Error(`priorityActions[${index}] must be an object`);
    const tone = action.tone;
    if (tone !== "error" && tone !== "warning" && tone !== "success") {
      throw new Error(`priorityActions[${index}].tone is invalid`);
    }

    return {
      id: toStringValue(action.id, `priorityActions[${index}].id`),
      title: toStringValue(action.title, `priorityActions[${index}].title`),
      detail: toStringValue(action.detail, `priorityActions[${index}].detail`),
      tone: tone as FunnelPriorityTone,
      ...(action.href === undefined ? {} : { href: toStringValue(action.href, `priorityActions[${index}].href`) }),
    };
  });
}

export function normalizeDirectorAdmissionFunnel(value: unknown): DirectorAdmissionFunnelData {
  const root = asRecord(value);
  const payload = root?.message !== undefined ? asRecord(root.message) : root;
  if (!payload) throw new Error("response must contain an object payload");

  const meta = asRecord(payload.meta);
  const summary = asRecord(payload.summary);
  if (!meta || !summary) throw new Error("response must contain meta and summary");

  const status = meta.status;
  if (status !== "available" && status !== "partial") throw new Error("meta.status is invalid");

  const warnings = meta.warnings === undefined
    ? undefined
    : toArray(meta.warnings, "meta.warnings").map((warning, index) => toStringValue(warning, `meta.warnings[${index}]`));

  const priorityStageId = toStageId(summary.priorityStageId, "summary.priorityStageId", true);
  const priorityNextStageId = toStageId(summary.priorityNextStageId, "summary.priorityNextStageId", true);

  return {
    meta: {
      admissionYear: toNumber(meta.admissionYear, "meta.admissionYear") as number,
      scope: toStringValue(meta.scope, "meta.scope"),
      scopeLabel: toStringValue(meta.scopeLabel, "meta.scopeLabel"),
      asOf: toStringValue(meta.asOf, "meta.asOf"),
      timezone: toStringValue(meta.timezone, "meta.timezone"),
      status,
      ...(warnings === undefined ? {} : { warnings }),
    },
    summary: {
      prospects: toNumber(summary.prospects, "summary.prospects") as number,
      enrolled: toNumber(summary.enrolled, "summary.enrolled") as number,
      enrollmentRate: toNumber(summary.enrollmentRate, "summary.enrollmentRate", true),
      priorityStageId,
      priorityNextStageId,
      priorityDropRate: toNumber(summary.priorityDropRate, "summary.priorityDropRate", true),
      priorityDropCount: toNumber(summary.priorityDropCount, "summary.priorityDropCount", true),
    },
    stages: normalizeStages(payload.stages),
    dropOffs: normalizeDropOffs(payload.dropOffs),
    aging: normalizeAging(payload.aging),
    sourcePerformance: normalizeSourcePerformance(payload.sourcePerformance),
    cohorts: normalizeCohorts(payload.cohorts),
    priorityActions: normalizePriorityActions(payload.priorityActions),
  };
}
