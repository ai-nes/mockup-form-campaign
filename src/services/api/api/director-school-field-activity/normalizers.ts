import type {
  CompletedFieldActivity,
  DeviceSyncOverview,
  DirectorSchoolFieldActivityData,
  FieldActivityAmountUnit,
  FieldActivityDataStatus,
  FieldActivityKpi,
  FieldActivityKpiId,
  FieldActivityKpiTone,
  FieldActivityKpiUnit,
  FieldActivityMeta,
  FieldActivityPeriod,
  FieldDataQuality,
  UpcomingFieldActivity,
} from "./types";

const statuses = new Set<FieldActivityDataStatus>(["available", "partial", "unavailable"]);
const periods = new Set<FieldActivityPeriod>(["season", "6m", "12m"]);
const kpiIds = new Set<FieldActivityKpiId>([
  "activity-count",
  "field-leads",
  "cost-per-enrollment",
  "field-conversion",
  "unsynced-records",
]);
const kpiUnits = new Set<FieldActivityKpiUnit>(["activities", "leads", "million_vnd", "percent", "records"]);
const kpiTones = new Set<FieldActivityKpiTone>(["primary", "success", "warning", "error"]);
const amountUnits = new Set<FieldActivityAmountUnit>(["vnd", "thousand_vnd", "million_vnd"]);
const activitySources = new Set<UpcomingFieldActivity["source"]>([
  "market-and-student-priority",
  "historical-activity",
  "manual",
  "mixed",
]);

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

function integer(value: unknown): number | null {
  const numericValue = number(value);
  return numericValue === null ? null : Math.max(0, Math.round(numericValue));
}

function percent(value: unknown): number | null {
  const numericValue = number(value);
  return numericValue === null ? null : Math.min(100, Math.max(0, numericValue));
}

function status(value: unknown, fallback: FieldActivityDataStatus = "unavailable"): FieldActivityDataStatus {
  const normalized = text(value);
  return normalized && statuses.has(normalized as FieldActivityDataStatus)
    ? (normalized as FieldActivityDataStatus)
    : fallback;
}

function normalizeMeta(value: unknown): FieldActivityMeta {
  const source = record(value);
  const sources = record(source.sources);
  const sourceStatus = (key: string) => status(sources[key]);
  const normalizedPeriod = text(source.period);

  return {
    admissionYear: integer(source.admissionYear ?? source.admission_year) ?? 0,
    scope: text(source.scope) ?? "all",
    scopeLabel: text(source.scopeLabel ?? source.scope_label) ?? "-",
    period: normalizedPeriod && periods.has(normalizedPeriod as FieldActivityPeriod)
      ? (normalizedPeriod as FieldActivityPeriod)
      : "season",
    asOf: text(source.asOf ?? source.as_of) ?? "",
    timezone: text(source.timezone) ?? "Asia/Ho_Chi_Minh",
    status: status(source.status),
    sources: {
      activities: sourceStatus("activities"),
      plans: sourceStatus("plans"),
      dataQuality: status(sources.dataQuality ?? sources.data_quality),
      deviceSync: status(sources.deviceSync ?? sources.device_sync),
    },
    warnings: Array.isArray(source.warnings)
      ? source.warnings.map(text).filter((item): item is string => item !== null)
      : [],
  };
}

function normalizeKpi(value: unknown): FieldActivityKpi | null {
  const source = record(value);
  const id = text(source.id);
  if (!id || !kpiIds.has(id as FieldActivityKpiId)) return null;

  const unit = text(source.unit);
  const tone = text(source.tone);
  const changeUnit = text(source.changeUnit ?? source.change_unit);
  const comparison = text(source.comparison);
  const benchmark = record(source.benchmark);

  return {
    id: id as FieldActivityKpiId,
    label: text(source.label) ?? id,
    value: number(source.value),
    unit: unit && kpiUnits.has(unit as FieldActivityKpiUnit) ? (unit as FieldActivityKpiUnit) : "records",
    change: number(source.change),
    changeUnit: changeUnit === "percent" || changeUnit === "percentage_points" || changeUnit === "absolute"
      ? changeUnit
      : null,
    comparison: comparison === "same_period_previous_year" || comparison === "previous_period" || comparison === "benchmark"
      ? comparison
      : null,
    shareOfProspects: percent(source.shareOfProspects ?? source.share_of_prospects),
    benchmark: text(benchmark.id)
      ? {
          id: text(benchmark.id) as string,
          label: text(benchmark.label) ?? text(benchmark.id) as string,
          value: number(benchmark.value),
          unit: benchmark.unit === "percent" ? "percent" : "million_vnd",
        }
      : null,
    detail: text(source.detail),
    tone: tone && kpiTones.has(tone as FieldActivityKpiTone) ? (tone as FieldActivityKpiTone) : "primary",
  };
}

function normalizeAmount(value: unknown): { amount: number | null; unit: FieldActivityAmountUnit } {
  const source = record(value);
  const unit = text(source.unit);
  return {
    amount: number(source.amount),
    unit: unit && amountUnits.has(unit as FieldActivityAmountUnit) ? (unit as FieldActivityAmountUnit) : "million_vnd",
  };
}

function normalizeCompletedActivity(value: unknown): CompletedFieldActivity | null {
  const source = record(value);
  const id = text(source.id);
  const title = text(source.title);
  if (!id || !title) return null;

  const statusValue = text(source.status);
  if (statusValue !== "completed") return null;

  return {
    id,
    activityType: text(source.activityType ?? source.activity_type) ?? "unknown",
    title,
    shortName: text(source.shortName ?? source.short_name) ?? title,
    occurredAt: text(source.occurredAt ?? source.occurred_at) ?? "",
    dateLabel: text(source.dateLabel ?? source.date_label),
    locationId: text(source.locationId ?? source.location_id),
    location: text(source.location) ?? "-",
    ownerId: text(source.ownerId ?? source.owner_id),
    owner: text(source.owner),
    cost: normalizeAmount(source.cost),
    leads: integer(source.leads),
    verifiedLeads: integer(source.verifiedLeads ?? source.verified_leads),
    verifiedRate: percent(source.verifiedRate ?? source.verified_rate),
    qualified: integer(source.qualified),
    enrolled: integer(source.enrolled),
    costPerEnrollment: normalizeAmount(source.costPerEnrollment ?? source.cost_per_enrollment),
    status: "completed",
    dataQuality: normalizeDataQualityStatus(source.dataQuality ?? source.data_quality),
  };
}

function normalizeDataQualityStatus(value: unknown): CompletedFieldActivity["dataQuality"] {
  const normalized = text(value);
  return normalized === "verified" || normalized === "partial" || normalized === "unavailable"
    ? normalized
    : "unavailable";
}

function normalizeUpcomingActivity(value: unknown): UpcomingFieldActivity | null {
  const source = record(value);
  const id = text(source.id);
  const title = text(source.title);
  if (!id || !title) return null;

  const expected = record(source.expectedEnrollment ?? source.expected_enrollment);
  const statusValue = text(source.status);
  const sourceValue = text(source.source);
  return {
    id,
    activityType: text(source.activityType ?? source.activity_type) ?? "unknown",
    title,
    locationId: text(source.locationId ?? source.location_id),
    location: text(source.location) ?? "-",
    scheduledAt: text(source.scheduledAt ?? source.scheduled_at) ?? "",
    dateLabel: text(source.dateLabel ?? source.date_label),
    expectedEnrollment: {
      min: integer(expected.min),
      max: integer(expected.max),
      unit: "students",
    },
    confidence: percent(source.confidence),
    historicalSampleSize: integer(source.historicalSampleSize ?? source.historical_sample_size),
    status: statusValue === "confirmed" || statusValue === "cancelled" ? statusValue : "planned",
    source: sourceValue && activitySources.has(sourceValue as UpcomingFieldActivity["source"])
      ? (sourceValue as UpcomingFieldActivity["source"])
      : "manual",
    evidence: Array.isArray(source.evidence)
      ? source.evidence.map(text).filter((item): item is string => item !== null)
      : [],
  };
}

function normalizeDataQuality(value: unknown): FieldDataQuality {
  const source = record(value);
  const attention = record(source.attention);
  const rawSeasonMetrics = source.seasonMetrics ?? source.season_metrics;
  const team = Array.isArray(source.team)
    ? source.team.map((item) => {
        const person = record(item);
        const userId = text(person.userId ?? person.user_id);
        const name = text(person.name);
        if (!userId || !name) return null;
        return {
          userId,
          name,
          records: integer(person.records) ?? 0,
          secondsPerRecord: number(person.secondsPerRecord ?? person.seconds_per_record),
          duplicateRate: percent(person.duplicateRate ?? person.duplicate_rate),
          missingRate: percent(person.missingRate ?? person.missing_rate),
        };
      }).filter((item): item is NonNullable<typeof item> => item !== null)
    : [];
  const seasonMetrics = Array.isArray(rawSeasonMetrics)
    ? rawSeasonMetrics.map((item) => {
        const metric = record(item);
        const id = text(metric.id);
        const label = text(metric.label);
        if (!id || !label) return null;
        const valueNumber = percent(metric.value);
        const target = percent(metric.target);
        const metricStatus = text(metric.status);
        return {
          id,
          label,
          value: valueNumber,
          target,
          unit: "percent" as const,
          status: metricStatus === "meets_target" || metricStatus === "below_target" || metricStatus === "unavailable"
            ? metricStatus
            : valueNumber === null
            ? "unavailable" as const
            : target !== null && valueNumber >= target
              ? "meets_target" as const
              : "below_target" as const,
        };
      }).filter((item): item is NonNullable<typeof item> => item !== null)
    : [];

  return {
    unsyncedRecords: integer(source.unsyncedRecords ?? source.unsynced_records) ?? 0,
    team,
    seasonMetrics,
    attention: text(attention.userId ?? attention.user_id) && text(attention.name)
      ? {
          userId: text(attention.userId ?? attention.user_id) as string,
          name: text(attention.name) as string,
          duplicateRate: percent(attention.duplicateRate ?? attention.duplicate_rate),
          missingRate: percent(attention.missingRate ?? attention.missing_rate),
          reason: text(attention.reason) ?? "",
        }
      : null,
  };
}

function normalizeDeviceSync(value: unknown): DeviceSyncOverview | null {
  if (value === null || value === undefined) return null;
  const source = record(value);
  const devices = Array.isArray(source.devices)
    ? source.devices.map((item) => {
        const device = record(item);
        const id = text(device.id);
        const label = text(device.label);
        if (!id || !label) return null;
        const connectionStatus = text(device.connectionStatus ?? device.connection_status);
        const normalizedConnectionStatus: DeviceSyncOverview["devices"][number]["connectionStatus"] =
          connectionStatus === "online" || connectionStatus === "offline" ? connectionStatus : "unknown";

        return {
          id,
          label,
          activityId: text(device.activityId ?? device.activity_id),
          activity: text(device.activity),
          synced: integer(device.synced) ?? 0,
          pending: integer(device.pending) ?? 0,
          errors: integer(device.errors) ?? 0,
          lastUpdatedAt: text(device.lastUpdatedAt ?? device.last_updated_at),
          lastUpdatedLabel: text(device.lastUpdatedLabel ?? device.last_updated_label),
          connectionStatus: normalizedConnectionStatus,
        };
      }).filter((item): item is NonNullable<typeof item> => item !== null)
    : [];

  return {
    status: status(source.status),
    totalUnsyncedRecords: integer(source.totalUnsyncedRecords ?? source.total_unsynced_records) ?? 0,
    totalErrors: integer(source.totalErrors ?? source.total_errors) ?? 0,
    devices,
    message: text(source.message),
  };
}

export function getFieldActivityPayload(value: unknown): Record<string, unknown> {
  const root = record(value);
  return record(root.message ?? root.data ?? root);
}

export function hasFieldActivityEnvelope(value: unknown): boolean {
  const payload = getFieldActivityPayload(value);
  return Object.keys(record(payload.meta)).length > 0 && Array.isArray(payload.kpis);
}

export function normalizeDirectorSchoolFieldActivity(value: unknown): DirectorSchoolFieldActivityData {
  const payload = getFieldActivityPayload(value);
  const rawCompletedActivities = payload.completedActivities ?? payload.completed_activities;
  const rawUpcomingActivities = payload.upcomingActivities ?? payload.upcoming_activities;
  const completedActivities = Array.isArray(rawCompletedActivities)
    ? rawCompletedActivities
        .map(normalizeCompletedActivity)
        .filter((item): item is CompletedFieldActivity => item !== null)
    : [];
  const upcomingActivities = Array.isArray(rawUpcomingActivities)
    ? rawUpcomingActivities
        .map(normalizeUpcomingActivity)
        .filter((item): item is UpcomingFieldActivity => item !== null)
    : [];

  return {
    meta: normalizeMeta(payload.meta),
    kpis: Array.isArray(payload.kpis)
      ? payload.kpis.map(normalizeKpi).filter((item): item is FieldActivityKpi => item !== null)
      : [],
    completedActivities,
    upcomingActivities,
    dataQuality: normalizeDataQuality(payload.dataQuality ?? payload.data_quality),
    deviceSync: normalizeDeviceSync(payload.deviceSync ?? payload.device_sync),
  };
}
