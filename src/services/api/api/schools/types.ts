export interface SchoolDirectoryRecord {
  id: string;
  provinceCode: string;
  province: string;
  districtCode: string;
  district: string;
  schoolCode: string;
  name: string;
  address: string;
  area: string;
  isBoardingSchool: boolean;
  phone?: string | null;
  email?: string | null;
  schoolType?: string | null;
  schoolTier?: string | null;
  boardingType?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface TrendPoint {
  label: string;
  prospects: number;
  applications: number;
  enrollment: number;
}

export interface SchoolActivity {
  id: string;
  type: "Thăm trường" | "Career Talk" | "Hội thảo" | "Gặp phụ huynh" | "Tư vấn";
  title: string;
  date: string;
  owner: string;
  status: "completed" | "scheduled";
  outcome?: string;
}

export type ActivityGroupLabel =
  | "Cuộc thi học thuật"
  | "Ngày hội hướng nghiệp"
  | "Tư vấn tại lớp"
  | "Tham quan cơ sở"
  | "Tập huấn giáo viên"
  | "Hoạt động trực tuyến";

export interface SchoolActivityStat {
  label: ActivityGroupLabel;
  audience: string;
  conversionRate: number;
  costPerActivity: number;
  recommended: boolean;
}

export interface SchoolDemographics {
  occupationProfile: string;
  relativeIncome: "Thấp" | "Trung bình" | "Cao" | "Chưa có dữ liệu";
  tuitionAffordability: string;
  awayFromHomeRate: string;
  parentInvolvement: "Thấp" | "Trung bình" | "Cao" | "Chưa có dữ liệu";
}

export interface SchoolSubjectMix {
  naturalScienceShare: number;
  socialScienceShare: number;
  recommendedMajorGroup: string;
}

export interface SchoolEarlyForecast {
  grade10CutoffScore: number;
  priorCohortResult: string;
  grade11SubjectSignal: string;
}

export type SchoolRelationshipLevel =
  | "Chưa tiếp xúc"
  | "Đã tiếp xúc"
  | "Có đầu mối"
  | "Hợp tác thường xuyên"
  | "Đối tác chiến lược";

export type SchoolClassification =
  | "Trọng điểm"
  | "Mở rộng"
  | "Duy trì"
  | "Sàng lọc";

export type SchoolContactRole =
  | "Ban giám hiệu"
  | "GVCN khối 12"
  | "GV phụ trách hướng nghiệp"
  | "Đoàn trường"
  | "Cựu học sinh đang học";

export interface SchoolContact {
  role: SchoolContactRole;
  hasContact: boolean;
  name?: string;
  lastTouch?: string;
  note: string;
}

export interface SchoolQuadrantPoint {
  id: string;
  name: string;
  potential: number;
  relationship: number;
  availableStudents: number;
  enrollment: number;
  isCurrent?: boolean;
}

export interface SchoolScoreBand {
  label: string;
  students: number;
  share: number;
  available?: boolean;
}

export const SCHOOL_EXAM_SCORE_BAND_LABELS = [
  "0–2",
  "2–4",
  "4–6",
  "6–8",
  "8–10",
] as const;

export type SchoolExamScoreBandLabel =
  (typeof SCHOOL_EXAM_SCORE_BAND_LABELS)[number];

export interface SchoolExamScoreBand {
  label: SchoolExamScoreBandLabel;
  students: number;
  share: number;
}

export type SchoolPotentialIndicatorId =
  | "P1"
  | "P2"
  | "P3"
  | "P4"
  | "P5"
  | "P6";

export interface SchoolPotentialIndicator {
  id: SchoolPotentialIndicatorId;
  label: string;
  score: number | null;
  weight: number;
  status?: "available" | "estimated" | "unavailable";
}

export interface SchoolChoiceBreakdown {
  label: string;
  students: number;
  share: number;
}

export interface SchoolIntelligenceData {
  school: SchoolDirectoryRecord;
  locality?: DirectorSchoolLocality;
  potentialScore: number | null;
  grade12Students: number;
  availableStudents: number;
  prospects: number;
  applications: number;
  enrollment: number;
  changes: {
    prospects: number;
    applications: number;
    enrollment: number;
  };
  performance: Record<"6m" | "year", TrendPoint[]>;
  geography: {
    cluster: string;
    clusterMeaning: string;
    travelTime: string;
    distanceTier: "Dưới 1 giờ" | "1–3 giờ" | "Trên 3 giờ" | "Chưa có dữ liệu";
    competitionDensity: "Thấp" | "Trung bình" | "Cao" | "Chưa có dữ liệu";
  };
  demographics: SchoolDemographics;
  subjectMix: SchoolSubjectMix;
  earlyForecast: SchoolEarlyForecast;
  activityStats: SchoolActivityStat[];
  relationship: {
    level: SchoolRelationshipLevel;
    score: number;
    contact: string;
    contactRole: string;
    lastTouch: string;
    nextTouch: string;
    source: string;
  };
  classification: {
    group: SchoolClassification;
    isKeyAccount: boolean;
    label: string | null;
    action: string | null;
  };
  quadrantPeers: SchoolQuadrantPoint[];
  scoreBands: SchoolScoreBand[];
  examScoreBands: SchoolExamScoreBand[];
  potentialIndicators?: SchoolPotentialIndicator[];
  academicGap: {
    reportCard: number;
    examScore: number;
  };
  postGraduationChoices: SchoolChoiceBreakdown[];
  competitionContext: {
    leadingChoice: string;
    lostReason: string;
    externalPresence: string;
  };
  dataFreshness: string;
  dataSources: {
    directory: string;
    examScore: string;
    reportCard: string;
    relationship: string;
  };
  contacts: SchoolContact[];
  activities: SchoolActivity[];
  dataAvailability?: DirectorSchoolDetailData["dataAvailability"];
  /** Raw response fields kept for analysis UI so null is not turned into a fallback value. */
  relationshipResponse?: DirectorSchoolDetailData["relationship"];
  classificationResponse?: DirectorSchoolDetailData["classification"];
  activitiesResponse?: DirectorSchoolDetailData["activities"];
}

export type SchoolRegion = "Miền Bắc" | "Miền Trung" | "Miền Nam";

export interface ProvinceSchoolReport {
  province: string;
  region: SchoolRegion;
  schools: number;
  prioritySchools: number;
  averagePotential: number;
}

export interface PrioritySchoolReport {
  school: SchoolDirectoryRecord;
  region: SchoolRegion;
  potentialScore: number;
  grade12Students: number;
  enrollmentForecast: number;
}

export interface SchoolReportData {
  totalSchools: number;
  totalProvinces: number;
  prioritySchools: number;
  averagePotential: number;
  regions: {
    region: SchoolRegion;
    schools: number;
    prioritySchools: number;
    averagePotential: number;
  }[];
  provinces: ProvinceSchoolReport[];
  priorityList: PrioritySchoolReport[];
}

export type DataAvailabilityStatus = "available" | "partial" | "unavailable";

export interface DirectorSchoolContact {
  fullName: string | null;
  role: string | null;
  position: string | null;
  relationshipStatus: string | null;
  lastTouch: string | null;
  nextTouch: string | null;
}

export interface DirectorSchoolActivity {
  activityType: string | null;
  occurredAt: string | null;
  scheduledAt: string | null;
  status: string | null;
  outcome: string | null;
  attendance: number | null;
}

export interface DirectorSchoolTrendPoint {
  label: string;
  prospects: number;
  applications: number;
  enrollment: number;
}

export interface DirectorSchoolGeography {
  cluster: string | null;
  clusterMeaning: string | null;
  travelTime: string | null;
  distanceTier: string | null;
  competitionDensity: string | null;
}

export interface DirectorSchoolDemographics {
  occupationProfile: string | null;
  relativeIncome: string | null;
  tuitionAffordability: string | null;
  awayFromHomeRate: string | null;
  parentInvolvement: string | null;
}

export interface DirectorSchoolSubjectMix {
  naturalScienceShare: number | null;
  socialScienceShare: number | null;
  recommendedMajorGroup: string | null;
}

export interface DirectorSchoolEarlyForecast {
  grade10CutoffScore: number | null;
  priorCohortResult: string | null;
  grade11SubjectSignal: string | null;
}

export interface DirectorSchoolActivityStat {
  label: string | null;
  audience: string | null;
  conversionRate: number | null;
  costPerActivity: number | null;
  recommended: boolean | null;
}

export interface DirectorSchoolQuadrantPeer {
  id: string | null;
  name: string | null;
  potential: number | null;
  relationship: number | null;
  availableStudents: number | null;
  enrollment: number | null;
  isCurrent?: boolean;
}

export interface DirectorSchoolScoreBand {
  label: string | null;
  students: number | null;
  share: number | null;
  available?: boolean;
}

export interface DirectorSchoolPotentialIndicator {
  id: string | null;
  label: string | null;
  score: number | null;
  weight: number | null;
  status: string | null;
}

export interface DirectorSchoolChoiceBreakdown {
  label: string | null;
  students: number | null;
  share: number | null;
}

export interface DirectorSchoolLocality {
  latitude: number | null;
  longitude: number | null;
  source: {
    name: string | null;
    address: string | null;
    coordinates: {
      latitude: number | null;
      longitude: number | null;
    };
  };
  province: string | null;
  ward: string | null;
  travelTime: string | null;
  distanceKm: number | null;
  marketStats: {
    schools: number | null;
    grade12Students: number | null;
    outOfProvinceRate: string | null;
    fptInterestRate: string | null;
  };
}

export interface DirectorSchoolDetailData {
  school: {
    id: string;
    provinceCode: string | null;
    province: string | null;
    wardCode: string | null;
    ward: string | null;
    schoolCode: string | null;
    name: string;
    address: string | null;
    area: string | null;
    isBoardingSchool: boolean | null;
    phone?: string | null;
    email?: string | null;
    schoolType?: string | null;
    schoolTier?: string | null;
    boardingType?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  potentialScore: number | null;
  grade12Students: number | null;
  availableStudents: number | null;
  prospects: number | null;
  applications: number | null;
  enrollment: number | null;
  changes: {
    prospects: number | null;
    applications: number | null;
    enrollment: number | null;
  };
  performance: {
    "6m": DirectorSchoolTrendPoint[];
    year: DirectorSchoolTrendPoint[];
  };
  geography: DirectorSchoolGeography | null;
  demographics: DirectorSchoolDemographics | null;
  subjectMix: DirectorSchoolSubjectMix | null;
  earlyForecast: DirectorSchoolEarlyForecast | null;
  activityStats: DirectorSchoolActivityStat[];
  relationship: {
    level: string | null;
    score: number | null;
    contact: string | null;
    contactRole: string | null;
    lastTouch: string | null;
    nextTouch: string | null;
  };
  classification: {
    group: SchoolClassification | null;
    isKeyAccount: boolean | null;
    label: string | null;
    action: string | null;
  };
  locality: DirectorSchoolLocality;
  quadrantPeers: DirectorSchoolQuadrantPeer[];
  scoreBands: DirectorSchoolScoreBand[];
  contacts: DirectorSchoolContact[];
  activities: DirectorSchoolActivity[];
  examScoreBands: SchoolExamScoreBand[];
  potentialIndicators: DirectorSchoolPotentialIndicator[];
  academicGap: {
    reportCard: number | null;
    examScore: number | null;
  } | null;
  postGraduationChoices: DirectorSchoolChoiceBreakdown[];
  competitionContext: {
    leadingChoice: string | null;
    lostReason: string | null;
    externalPresence: string | null;
  } | null;
  dataSources: {
    directory: string | null;
    snapshot: string | null;
    relationship: string | null;
    activities: string | null;
    examScore?: string | null;
    reportCard?: string | null;
  };
  asOf: string | null;
  dataAvailability: {
    status?: DataAvailabilityStatus;
    sections: Record<string, DataAvailabilityStatus>;
    fields: Record<string, DataAvailabilityStatus>;
  };
}
