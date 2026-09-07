export type FieldActivityPeriod = "season" | "6m" | "12m";
export type FieldActivityDataStatus = "available" | "partial" | "unavailable";

export interface DirectorSchoolFieldActivityParams {
  admissionYear?: number;
  scope?: string;
  period?: FieldActivityPeriod;
  activityLimit?: number;
  upcomingLimit?: number;
  includeDevices?: boolean;
}

export interface FieldActivityMeta {
  admissionYear: number;
  scope: string;
  scopeLabel: string;
  period: FieldActivityPeriod;
  asOf: string;
  timezone: string;
  status: FieldActivityDataStatus;
  sources: {
    activities: FieldActivityDataStatus;
    plans: FieldActivityDataStatus;
    dataQuality: FieldActivityDataStatus;
    deviceSync: FieldActivityDataStatus;
  };
  warnings: string[];
}

export type FieldActivityKpiId =
  | "activity-count"
  | "field-leads"
  | "cost-per-enrollment"
  | "field-conversion"
  | "unsynced-records";

export type FieldActivityKpiUnit = "activities" | "leads" | "million_vnd" | "percent" | "records";
export type FieldActivityKpiTone = "primary" | "success" | "warning" | "error";

export interface FieldActivityKpi {
  id: FieldActivityKpiId;
  label: string;
  value: number | null;
  unit: FieldActivityKpiUnit;
  change: number | null;
  changeUnit: "percent" | "percentage_points" | "absolute" | null;
  comparison: "same_period_previous_year" | "previous_period" | "benchmark" | null;
  shareOfProspects: number | null;
  benchmark: {
    id: string;
    label: string;
    value: number | null;
    unit: "million_vnd" | "percent";
  } | null;
  detail: string | null;
  tone: FieldActivityKpiTone;
}

export type FieldActivityAmountUnit = "vnd" | "thousand_vnd" | "million_vnd";

export interface CompletedFieldActivity {
  id: string;
  activityType: string;
  title: string;
  shortName: string;
  occurredAt: string;
  dateLabel: string | null;
  locationId: string | null;
  location: string;
  ownerId: string | null;
  owner: string | null;
  cost: {
    amount: number | null;
    unit: FieldActivityAmountUnit;
  };
  leads: number | null;
  verifiedLeads: number | null;
  verifiedRate: number | null;
  qualified: number | null;
  enrolled: number | null;
  costPerEnrollment: {
    amount: number | null;
    unit: FieldActivityAmountUnit;
  };
  status: "completed";
  dataQuality: "verified" | "partial" | "unavailable";
}

export interface UpcomingFieldActivity {
  id: string;
  activityType: string;
  title: string;
  locationId: string | null;
  location: string;
  scheduledAt: string;
  dateLabel: string | null;
  expectedEnrollment: {
    min: number | null;
    max: number | null;
    unit: "students";
  };
  confidence: number | null;
  historicalSampleSize: number | null;
  status: "planned" | "confirmed" | "cancelled";
  source: "market-and-student-priority" | "historical-activity" | "manual" | "mixed";
  evidence: string[];
}

export interface FieldDataQuality {
  unsyncedRecords: number;
  team: Array<{
    userId: string;
    name: string;
    records: number;
    secondsPerRecord: number | null;
    duplicateRate: number | null;
    missingRate: number | null;
  }>;
  seasonMetrics: Array<{
    id: string;
    label: string;
    value: number | null;
    target: number | null;
    unit: "percent";
    status: "meets_target" | "below_target" | "unavailable";
  }>;
  attention: {
    userId: string;
    name: string;
    duplicateRate: number | null;
    missingRate: number | null;
    reason: string;
  } | null;
}

export interface DeviceSyncOverview {
  status: FieldActivityDataStatus;
  totalUnsyncedRecords: number;
  totalErrors: number;
  devices: Array<{
    id: string;
    label: string;
    activityId: string | null;
    activity: string | null;
    synced: number;
    pending: number;
    errors: number;
    lastUpdatedAt: string | null;
    lastUpdatedLabel: string | null;
    connectionStatus: "online" | "offline" | "unknown";
  }>;
  message: string | null;
}

export interface DirectorSchoolFieldActivityData {
  meta: FieldActivityMeta;
  kpis: FieldActivityKpi[];
  completedActivities: CompletedFieldActivity[];
  upcomingActivities: UpcomingFieldActivity[];
  dataQuality: FieldDataQuality;
  deviceSync: DeviceSyncOverview | null;
}
