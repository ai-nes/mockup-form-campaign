import { SCHOOL_EXAM_SCORE_BAND_LABELS } from "./types";
import type {
  DataAvailabilityStatus,
  DirectorSchoolActivity,
  DirectorSchoolActivityStat,
  DirectorSchoolContact,
  DirectorSchoolDetailData,
  DirectorSchoolGeography,
  DirectorSchoolLocality,
  DirectorSchoolPotentialIndicator,
  DirectorSchoolScoreBand,
  DirectorSchoolTrendPoint,
  SchoolExamScoreBand,
  SchoolClassification,
} from "./types";

type GetSchoolOptions = { admissionYear?: number; baseUrl?: string };

function frappeCookieHeader(cookieHeader: string): string {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.split("=", 1)[0] === "sid")
    .join("; ");
}

function hasSchoolEnvelope(value: unknown): boolean {
  const root = record(value);
  const message = record(root.message);
  const school = record(message.school);
  const availability = record(message.dataAvailability);
  const meta = record(message.meta);
  return (
    typeof school.id === "string" &&
    !!school.id.trim() &&
    typeof school.name === "string" &&
    !!availability.sections &&
    !!meta.admissionYear
  );
}

const statuses = new Set(["available", "partial", "unavailable"]);
const classifications = new Set([
  "Trọng điểm",
  "Mở rộng",
  "Duy trì",
  "Sàng lọc",
]);
const activityGroupLabels = new Set([
  "Cuộc thi học thuật",
  "Ngày hội hướng nghiệp",
  "Tư vấn tại lớp",
  "Tham quan cơ sở",
  "Tập huấn giáo viên",
  "Hoạt động trực tuyến",
]);
const potentialIndicatorIds = new Set(["P1", "P2", "P3", "P4", "P5", "P6"]);

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

function boolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function normalizeAvailability(
  value: unknown,
): DirectorSchoolDetailData["dataAvailability"] {
  const source = record(value);
  const normalizeMap = (candidate: unknown) =>
    Object.fromEntries(
      Object.entries(record(candidate)).filter(([, status]) =>
        statuses.has(String(status)),
      ),
    ) as Record<string, DataAvailabilityStatus>;
  const sections = normalizeMap(source.sections);
  const fields = normalizeMap(source.fields);
  const values = [...Object.values(sections), ...Object.values(fields)];
  const status = statuses.has(String(source.status))
    ? (source.status as DataAvailabilityStatus)
    : values.length === 0
      ? undefined
      : values.every((item) => item === "unavailable")
        ? "unavailable"
        : values.some((item) => item === "unavailable" || item === "partial")
          ? "partial"
          : "available";
  return { status, sections, fields };
}

function normalizeContact(value: unknown): DirectorSchoolContact | null {
  const source = record(value);
  const role = text(source.role);
  const fullName = text(source.full_name ?? source.fullName);
  if (!role && !fullName) return null;
  return {
    fullName,
    role,
    position: text(source.position),
    relationshipStatus: text(
      source.relationship_status ?? source.relationshipStatus,
    ),
    lastTouch: text(source.last_touch ?? source.lastTouch),
    nextTouch: text(source.next_touch ?? source.nextTouch),
  };
}

function normalizeActivity(value: unknown): DirectorSchoolActivity | null {
  const source = record(value);
  const activityType = text(
    source.activity_type ?? source.activityType ?? source.type,
  );
  const status = text(source.status);
  if (!activityType && !status) return null;
  return {
    activityType,
    occurredAt: text(source.occurred_at ?? source.occurredAt ?? source.date),
    scheduledAt: text(source.scheduled_at ?? source.scheduledAt),
    status,
    outcome: text(source.outcome),
    attendance: number(source.attendance),
  };
}

function normalizeExamScoreBands(value: unknown): SchoolExamScoreBand[] {
  const bands = (Array.isArray(value) ? value : [])
    .map((item) => {
      const source = record(item);
      const label = normalizeExamScoreBandLabel(
        source.label ?? source.range ?? source.scoreRange ?? source.score_range,
      );
      const students = number(
        source.students ??
          source.studentCount ??
          source.student_count ??
          source.count,
      );
      const share = number(
        source.share ?? source.sharePercent ?? source.share_percent,
      );

      if (!label || students === null) return null;
      return {
        label,
        students: Math.max(0, Math.round(students)),
        share: share === null ? 0 : Math.min(100, Math.max(0, share)),
      } satisfies SchoolExamScoreBand;
    })
    .filter((item): item is SchoolExamScoreBand => item !== null);

  const bandsByLabel = new Map(bands.map((band) => [band.label, band]));
  const completeBands = SCHOOL_EXAM_SCORE_BAND_LABELS.map(
    (label) => bandsByLabel.get(label) ?? { label, students: 0, share: 0 },
  );
  const totalStudents = completeBands.reduce(
    (total, band) => total + band.students,
    0,
  );
  if (!totalStudents) return completeBands;

  const shares = completeBands.map(
    (band) => band.share || Math.round((band.students / totalStudents) * 100),
  );
  shares[shares.length - 1] +=
    100 - shares.reduce((total, share) => total + share, 0);

  return completeBands.map((band, index) => ({
    ...band,
    share: shares[index],
  }));
}

function normalizeExamScoreBandLabel(
  value: unknown,
): SchoolExamScoreBand["label"] | null {
  const label = text(value);
  if (!label) return null;

  return (
    SCHOOL_EXAM_SCORE_BAND_LABELS.find(
      (item) => item === label || item.replace("–", "-") === label,
    ) ?? null
  );
}

function normalizeTrend(value: unknown): DirectorSchoolTrendPoint[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const source = record(item);
      const label = text(source.label);
      const prospects = number(source.prospects);
      const applications = number(source.applications);
      const enrollment = number(source.enrollment);
      if (
        !label ||
        prospects === null ||
        applications === null ||
        enrollment === null
      )
        return null;
      return { label, prospects, applications, enrollment };
    })
    .filter((item): item is DirectorSchoolTrendPoint => item !== null);
}

function normalizeGeography(value: unknown): DirectorSchoolGeography | null {
  const source = record(value);
  if (!Object.keys(source).length) return null;
  return {
    cluster: text(source.cluster),
    clusterMeaning: text(source.clusterMeaning ?? source.cluster_meaning),
    travelTime: text(source.travelTime ?? source.travel_time),
    distanceTier: text(source.distanceTier ?? source.distance_tier),
    competitionDensity: text(
      source.competitionDensity ?? source.competition_density,
    ),
  };
}

function normalizeDemographics(
  value: unknown,
): NonNullable<DirectorSchoolDetailData["demographics"]> | null {
  const source = record(value);
  if (!Object.keys(source).length) return null;
  return {
    occupationProfile: text(
      source.occupationProfile ?? source.occupation_profile,
    ),
    relativeIncome: text(source.relativeIncome ?? source.relative_income),
    tuitionAffordability: text(
      source.tuitionAffordability ?? source.tuition_affordability,
    ),
    awayFromHomeRate: text(
      source.awayFromHomeRate ?? source.away_from_home_rate,
    ),
    parentInvolvement: text(
      source.parentInvolvement ?? source.parent_involvement,
    ),
  };
}

function normalizeSubjectMix(
  value: unknown,
): NonNullable<DirectorSchoolDetailData["subjectMix"]> | null {
  const source = record(value);
  if (!Object.keys(source).length) return null;
  return {
    naturalScienceShare: number(
      source.naturalScienceShare ?? source.natural_science_share,
    ),
    socialScienceShare: number(
      source.socialScienceShare ?? source.social_science_share,
    ),
    recommendedMajorGroup: text(
      source.recommendedMajorGroup ?? source.recommended_major_group,
    ),
  };
}

function normalizeEarlyForecast(
  value: unknown,
): NonNullable<DirectorSchoolDetailData["earlyForecast"]> | null {
  const source = record(value);
  if (!Object.keys(source).length) return null;
  return {
    grade10CutoffScore: number(
      source.grade10CutoffScore ?? source.grade10_cutoff_score,
    ),
    priorCohortResult: text(
      source.priorCohortResult ?? source.prior_cohort_result,
    ),
    grade11SubjectSignal: text(
      source.grade11SubjectSignal ?? source.grade11_subject_signal,
    ),
  };
}

function normalizeActivityStats(value: unknown): DirectorSchoolActivityStat[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): DirectorSchoolActivityStat[] => {
    const source = record(item);
    const label = text(source.label);
    if (!label || !activityGroupLabels.has(label)) return [];
    return [
      {
        label,
        audience: text(source.audience),
        conversionRate: number(source.conversionRate ?? source.conversion_rate),
        costPerActivity: number(
          source.costPerActivity ?? source.cost_per_activity,
        ),
        recommended: boolean(source.recommended),
      },
    ];
  });
}

function normalizeQuadrantPeers(
  value: unknown,
): NonNullable<DirectorSchoolDetailData["quadrantPeers"]> {
  if (!Array.isArray(value)) return [];
  return value.flatMap(
    (item): NonNullable<DirectorSchoolDetailData["quadrantPeers"]> => {
      const source = record(item);
      const id = text(source.id);
      const name = text(source.name);
      if (!id || !name) return [];
      return [
        {
          id,
          name,
          potential: number(source.potential),
          relationship: number(source.relationship),
          availableStudents: number(
            source.availableStudents ?? source.available_students,
          ),
          enrollment: number(source.enrollment),
          isCurrent:
            boolean(source.isCurrent ?? source.is_current) ?? undefined,
        },
      ];
    },
  );
}

function normalizeScoreBands(value: unknown): DirectorSchoolScoreBand[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): DirectorSchoolScoreBand[] => {
    const source = record(item);
    const label = text(source.label);
    const students = number(source.students ?? source.student_count);
    if (!label || students === null) return [];
    return [
      {
        label,
        students: Math.max(0, Math.round(students)),
        share: number(source.share ?? source.share_percent) ?? 0,
        available: boolean(source.available) ?? undefined,
      },
    ];
  });
}

function normalizePotentialIndicators(
  value: unknown,
): DirectorSchoolPotentialIndicator[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): DirectorSchoolPotentialIndicator[] => {
    const source = record(item);
    const id = text(source.id);
    if (!id || !potentialIndicatorIds.has(id)) return [];
    return [
      {
        id,
        label: text(source.label),
        score: number(source.score),
        weight: number(source.weight),
        status: text(source.status),
      },
    ];
  });
}

function normalizeChoices(
  value: unknown,
): NonNullable<DirectorSchoolDetailData["postGraduationChoices"]> {
  if (!Array.isArray(value)) return [];
  return value.flatMap(
    (item): NonNullable<DirectorSchoolDetailData["postGraduationChoices"]> => {
      const source = record(item);
      const label = text(source.label);
      if (!label) return [];
      return [
        {
          label,
          students: number(source.students ?? source.student_count),
          share: number(source.share ?? source.share_percent),
        },
      ];
    },
  );
}

function normalizeLocality(
  value: unknown,
  school: Record<string, unknown>,
): DirectorSchoolLocality {
  const source = record(value);
  const sourceDetails = record(source.source);
  const coordinates = record(source.coordinates ?? sourceDetails.coordinates);
  const latitude = number(
    coordinates.latitude ?? source.latitude ?? school.latitude,
  );
  const longitude = number(
    coordinates.longitude ?? source.longitude ?? school.longitude,
  );
  const marketStats = record(source.marketStats ?? source.market_stats);
  return {
    latitude,
    longitude,
    source: {
      name: text(sourceDetails.name ?? school.name),
      address: text(sourceDetails.address ?? school.address),
      coordinates: { latitude, longitude },
    },
    province: text(source.province),
    ward: text(source.ward),
    travelTime: text(source.travelTime ?? source.travel_time),
    distanceKm: number(source.distanceKm ?? source.distance_km),
    marketStats: {
      schools: number(marketStats.schools),
      grade12Students: number(
        marketStats.grade12Students ?? marketStats.grade12_students,
      ),
      outOfProvinceRate: text(
        marketStats.outOfProvinceRate ?? marketStats.out_of_province_rate,
      ),
      fptInterestRate: text(
        marketStats.fptInterestRate ?? marketStats.fpt_interest_rate,
      ),
    },
  };
}

export function normalizeSchoolIntelligence(
  value: unknown,
): DirectorSchoolDetailData {
  const root = record(value);
  const data = record(
    root.data && !Array.isArray(root.data) ? root.data : root,
  );
  const school = record(data.school ?? data.identity);
  const relationship = record(data.relationship);
  const classification = record(data.classification);
  const changes = record(data.changes);
  const performance = record(data.performance);
  const academicGap = record(data.academicGap);
  const competitionContext = record(data.competitionContext);
  const dataSources = record(data.dataSources);
  const contacts = Array.isArray(
    data.contacts ?? data.stakeholders ?? relationship.contacts,
  )
    ? ((data.contacts ??
        data.stakeholders ??
        relationship.contacts) as unknown[])
    : [];
  const activities = Array.isArray(data.activities) ? data.activities : [];
  const id = text(school.id ?? school.externalId ?? data.schoolId);
  const name = text(school.name);
  if (!id || !name)
    throw new Error("Phản hồi trường học thiếu định danh bắt buộc.");
  const group = text(classification.group);

  return {
    school: {
      id,
      provinceCode: text(school.provinceCode ?? school.province_code),
      province: text(school.province),
      wardCode: text(
        school.wardCode ?? school.ward_code ?? school.districtCode,
      ),
      ward: text(school.ward ?? school.district),
      schoolCode: text(school.schoolCode ?? school.school_code),
      name,
      address: text(school.address),
      area: text(school.area),
      isBoardingSchool: boolean(
        school.isBoardingSchool ?? school.is_boarding_school,
      ),
      phone: text(school.phone),
      email: text(school.email),
      schoolType: text(school.schoolType ?? school.school_type),
      schoolTier: text(school.schoolTier ?? school.school_tier),
      boardingType: text(school.boardingType ?? school.boarding_type),
      latitude: number(school.latitude),
      longitude: number(school.longitude),
    },
    potentialScore: number(data.potentialScore),
    grade12Students: number(data.grade12Students),
    availableStudents: number(data.availableStudents),
    prospects: number(data.prospects),
    applications: number(data.applications),
    enrollment: number(data.enrollment),
    changes: {
      prospects: number(changes.prospects),
      applications: number(changes.applications),
      enrollment: number(changes.enrollment),
    },
    performance: {
      "6m": normalizeTrend(
        performance["6m"] ?? performance.sixMonths ?? performance.six_months,
      ),
      year: normalizeTrend(performance.year),
    },
    geography: normalizeGeography(data.geography),
    demographics: normalizeDemographics(data.demographics),
    subjectMix: normalizeSubjectMix(data.subjectMix ?? data.subject_mix),
    earlyForecast: normalizeEarlyForecast(
      data.earlyForecast ?? data.early_forecast,
    ),
    activityStats: normalizeActivityStats(
      data.activityStats ?? data.activity_stats,
    ),
    relationship: {
      level: text(relationship.level),
      score: number(relationship.score),
      contact: text(relationship.contact),
      contactRole: text(relationship.contactRole ?? relationship.contact_role),
      lastTouch: text(relationship.lastTouch ?? relationship.last_touch),
      nextTouch: text(relationship.nextTouch ?? relationship.next_touch),
    },
    classification: {
      group: classifications.has(group ?? "")
        ? (group as SchoolClassification)
        : null,
      isKeyAccount: boolean(
        classification.isKeyAccount ?? classification.is_key_account,
      ),
      label: text(classification.label),
      action: text(
        classification.action ??
          classification.nextAction ??
          classification.next_action,
      ),
    },
    locality: normalizeLocality(data.locality, school),
    quadrantPeers: normalizeQuadrantPeers(
      data.quadrantPeers ?? data.quadrant_peers,
    ),
    scoreBands: normalizeScoreBands(data.scoreBands ?? data.score_bands),
    contacts: contacts
      .map(normalizeContact)
      .filter((item): item is DirectorSchoolContact => item !== null),
    activities: activities
      .map(normalizeActivity)
      .filter((item): item is DirectorSchoolActivity => item !== null),
    examScoreBands: normalizeExamScoreBands(
      data.examScoreBands ??
        data.exam_score_bands ??
        data.scoreDistribution ??
        data.score_distribution,
    ),
    potentialIndicators: normalizePotentialIndicators(
      data.potentialIndicators ?? data.potential_indicators,
    ),
    academicGap: Object.keys(academicGap).length
      ? {
          reportCard: number(academicGap.reportCard ?? academicGap.report_card),
          examScore: number(academicGap.examScore ?? academicGap.exam_score),
        }
      : null,
    postGraduationChoices: normalizeChoices(
      data.postGraduationChoices ?? data.post_graduation_choices,
    ),
    competitionContext: Object.keys(competitionContext).length
      ? {
          leadingChoice: text(
            competitionContext.leadingChoice ??
              competitionContext.leading_choice,
          ),
          lostReason: text(
            competitionContext.lostReason ?? competitionContext.lost_reason,
          ),
          externalPresence: text(
            competitionContext.externalPresence ??
              competitionContext.external_presence,
          ),
        }
      : null,
    dataSources: {
      directory: text(dataSources.directory),
      snapshot: text(dataSources.snapshot),
      relationship: text(dataSources.relationship),
      activities: text(dataSources.activities),
      examScore: text(dataSources.examScore ?? dataSources.exam_score),
      reportCard: text(dataSources.reportCard ?? dataSources.report_card),
    },
    asOf: text(record(root.meta).asOf ?? data.asOf),
    dataAvailability: {
      ...normalizeAvailability(data.dataAvailability ?? root.dataAvailability),
      status: statuses.has(String(root.status))
        ? (root.status as DataAvailabilityStatus)
        : normalizeAvailability(data.dataAvailability ?? root.dataAvailability)
            .status,
    },
  };
}

export class DirectorApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "DirectorApiError";
  }
}

export async function getDirectorSchoolDetail(
  schoolId: string,
  options: GetSchoolOptions = {},
): Promise<DirectorSchoolDetailData | null> {
  const query = new URLSearchParams({ school_id: schoolId });
  if (options.admissionYear)
    query.set("admissionYear", String(options.admissionYear));
  const baseUrl = (
    options.baseUrl ??
    process.env.NEXT_PUBLIC_FRAPPE_URL ??
    ""
  ).replace(/\/+$/, "");
  const method = "crm.api.director_school_detail.get_director_school_detail";
  const headers: Record<string, string> = { Accept: "application/json" };

  if (!options.baseUrl) {
    try {
      const { cookies } = await import("next/headers");
      const cookieHeader = frappeCookieHeader((await cookies()).toString());
      if (cookieHeader) headers.Cookie = cookieHeader;
    } catch {
      // Outside a Next request context (for example, contract tests).
    }
  }

  const response = await fetch(
    `${baseUrl}/api/method/${method}?${query.toString()}`,
    {
      headers,
      // Client-side the session cookie rides along on the cross-origin request;
      // server-side it is forwarded explicitly via the Cookie header above.
      ...(typeof window !== "undefined"
        ? { credentials: "include" as RequestCredentials }
        : {}),
      cache: "no-store",
    },
  );
  const payload = await response.json().catch(() => ({}));
  const error = payload?.error ?? {};
  if (response.status === 404 && error.code === "SCHOOL_NOT_FOUND") return null;
  if (!response.ok) {
    throw new DirectorApiError(
      response.status,
      typeof error.code === "string" ? error.code : "SCHOOL_DATA_UNAVAILABLE",
      typeof error.message === "string"
        ? error.message
        : "Không thể tải dữ liệu trường học.",
    );
  }
  if (!hasSchoolEnvelope(payload)) {
    throw new DirectorApiError(
      502,
      "INVALID_SCHOOL_RESPONSE",
      "Phản hồi dữ liệu trường học không hợp lệ.",
    );
  }
  return normalizeSchoolIntelligence(payload?.message ?? payload);
}
