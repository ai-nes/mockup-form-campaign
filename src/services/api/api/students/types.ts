export type StudentJourneyStage =
  | "Quan tâm"
  | "Tìm hiểu"
  | "Tư vấn"
  | "Ứng tuyển"
  | "Nhập học";

export type StudentAssignmentStatus = "assigned" | "unassigned";

export type StudentLifecycleStatus =
  | "Lead"
  | "MQL"
  | "Applicant"
  | "Enrolled"
  | "Lost";

export type StudentPriority = "Cao" | "Trung bình" | "Thấp";

export type StudentVerificationStatus =
  | "Đã xác thực"
  | "Chưa xác thực"
  | "Cần xác minh";

export type StudentConsentStatus =
  | "Đã đồng ý"
  | "Chưa đồng ý"
  | "Đã rút lại"
  | "Chưa xác định";

export interface StudentContactConsent {
  status: StudentConsentStatus;
  channels: ("Điện thoại" | "Zalo" | "Email")[];
  updatedAt?: string | null;
}

export interface StudentProbabilityTrendPoint {
  date: string;
  score: number;
  touches: number;
  eventTitle?: string | null;
  eventDetail?: string | null;
  channel?: string | null;
}

export interface StudentChannelActivity {
  title: string;
  time?: string | null;
  description?: string | null;
}

export interface StudentChannelPerformanceItem {
  channel: string;
  touches: number;
  response: number;
  activities?: StudentChannelActivity[];
  effectiveness?: string | null;
  notes?: string | null;
}

export type StudentTaskType = "call" | "email" | "todo";

export type StudentZaloDirection = "inbound" | "outbound";

export type StudentZaloMessageStatus = "sent" | "delivered" | "read" | "failed";

export interface StudentZaloMessage {
  id: string;
  time: string;
  senderName: string;
  senderRole?: string;
  recipientName: string;
  recipientRole?: string;
  content: string;
  direction: StudentZaloDirection;
  status?: StudentZaloMessageStatus;
  conversationTitle?: string;
  attachmentName?: string;
}

export interface StudentChatwootInteraction {
  name: string;
  student?: string | null;
  crm_contact?: string | null;
  interaction_type: string;
  interaction_datetime: string;
  summary?: string | null;
  notes?: string | null;
  channel?: string | null;
  direction?: StudentZaloDirection | null;
  conversation_id?: string | null;
  agent_id?: string | null;
  outcome?: string | null;
  actor?: string | null;
  source_namespace?: string | null;
  source_record_id?: string | null;
  creation?: string | null;
}

export interface StudentChatwootInteractionsResponse {
  student_id: string;
  data: StudentChatwootInteraction[];
  zalo_messages: StudentZaloMessage[];
  meta: {
    page: number;
    page_size: number;
    total: number;
    has_next_page: boolean;
  };
}

export type StudentCallDirection = "inbound" | "outbound" | "missed";

export type StudentCallOutcome =
  | "connected"
  | "missed"
  | "no-answer"
  | "callback";

export interface StudentCallRecord {
  id: string;
  time: string;
  direction: StudentCallDirection;
  outcome: StudentCallOutcome;
  callerName: string;
  receiverName: string;
  callerRole?: string;
  receiverRole?: string;
  phoneNumber?: string;
  durationSeconds?: number;
  topic?: string;
  summary?: string;
  recordingUrl?: string;
}

export interface StudentInteractionsResponse {
  student_id: string;
  zalo_messages: StudentZaloMessage[];
  calls: StudentCallRecord[];
  total_interactions: number;
}

export type StudentClassificationTone =
  | "primary"
  | "success"
  | "warning"
  | "sky"
  | "gray";

export interface StudentFitFactor {
  label:
    | "Ngành"
    | "Hồ sơ học tập"
    | "Phương thức xét tuyển"
    | "Chi phí"
    | "Địa lý";
  value: string;
  tone: StudentClassificationTone;
}

export interface StudentClassificationDimension {
  id: "journey" | "interest" | "fit" | "barrier";
  label: string;
  value: string;
  description: string;
  evidence: string[];
  tone: StudentClassificationTone;
  fitFactors?: StudentFitFactor[];
}

export interface StudentListItem {
  id: string;
  initials: string;
  name: string;
  code: string;
  school: string;
  province: string;
  provinceId?: string | null;
  major: string;
  stage: StudentJourneyStage;
  assignmentStatus?: StudentAssignmentStatus;
  lifecycleStatus?: StudentLifecycleStatus | null;
  score: number;
  scoreDelta: number;
  lastActivity: string;
  nextAction: string;
  owner: string;
  /** Ownership CAS revision returned by the student list API. */
  revision: number;
  source: string;
  priority: StudentPriority;
}

export interface StudentTaskItem {
  id: string;
  title: string;
  actionCode?: string;
  assignee: string;
  assigneeId?: string;
  activityDate?: string;
  dueDate: string;
  dueTime?: string;
  status: "todo" | "in-progress" | "done" | "canceled";
  priority: StudentPriority;
  taskType?: StudentTaskType;
  notes?: string;
}

export interface StudentNoteItem {
  name?: string;
  author: string;
  date: string;
  content: string;
}

export interface StudentJourneyEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  channel: "Website" | "Sự kiện" | "Cuộc gọi" | "Zalo" | "Hồ sơ";
  status: "completed" | "current" | "upcoming";
}

export interface Student360Data {
  student: {
    initials: string;
    name: string;
    code: string;
    school: string;
    grade: string;
    studyStage?: string | null;
    major: string;
    phone: string;
    email: string;
    province: string;
    ward?: string | null;
    counselor: string;
    ownerId?: string | null;
    priority?: StudentPriority | null;
    verificationStatus?: StudentVerificationStatus | null;
    contactConsent?: StudentContactConsent | null;
    lastUpdatedAt?: string | null;
  };
  readiness: {
    label: string;
    value: number;
    tone: "success" | "warning" | "error";
    detail: string;
  }[];
  profile: { label: string; value: string }[];
  academics: { label: string; value: string }[];
  family: { label: string; value: string; emphasis?: boolean }[];
  classification: {
    dimensions: StudentClassificationDimension[];
    combination: string;
    interpretation: string;
    action: string;
    updatedAt: string;
    updateTrigger: string;
    reviewStatus: "Đã xác nhận" | "Chờ xác nhận";
    reviewedBy: string;
  };
  acquisition: {
    firstTouch: string;
    sourceGroup:
      | "Trực tuyến chủ động"
      | "Trực tuyến qua quảng cáo"
      | "Thực địa"
      | "Giới thiệu";
    campaign: string;
    capturedAt: string;
    attributionModel: string;
    consent: string;
  };
  segmentation: {
    learningStage: string;
    approachGoal: string;
    geographyTier: string;
    geographyImplication: string;
    schoolTier: string;
    economicContext: string;
    economicUsage: string;
  };
  parentProfile: {
    name: string;
    relation: string;
    involvement: "Cao" | "Trung bình" | "Thấp" | "Chưa xác định";
    role: string;
    concerns: string[];
    preferredChannel: string;
    bestContactTime: string;
    consentStatus: string;
    lastInteraction: string;
  };
  insight: {
    summary: string;
    signalScore: number | null;
    probability: number | null;
    potentialLabel?: "Tiềm năng cao" | "Tiềm năng vừa" | "Cần chú ý" | null;
    priorityThreshold?: number | null;
    scoreDelta?: number;
    baseline?: number;
    confidence?: number;
    concern: string;
    decisionMaker: string;
    evidence: string[];
    recommendation: string;
  };
  journey: StudentJourneyEvent[];
  engagement: {
    label: string;
    value: string;
    level: "Cao" | "Trung bình" | "Thấp";
  }[];
  application: {
    label: string;
    value: string;
    status?: "success" | "warning" | "primary";
  }[];
  probabilityTrend?: StudentProbabilityTrendPoint[];
  channelPerformance?: StudentChannelPerformanceItem[];
  documents?: {
    name: string;
    type: string;
    status: string;
    tone: "success" | "warning" | "gray" | "primary" | "error";
    date: string;
  }[];
  notes?: StudentNoteItem[];
  tasks?: StudentTaskItem[];
  zaloMessages?: StudentZaloMessage[];
  calls?: StudentCallRecord[];
  auditEvents?: {
    actor: string;
    action: string;
    time: string;
    status: string;
    tone: "success" | "primary" | "warning" | "error";
  }[];
}

export interface DirectorStudentsParams {
  admissionYear?: number;
  page?: number;
  pageSize?: number;
  q?: string;
  stage?: StudentJourneyStage | "all" | string;
  province?: string;
  provinceId?: string;
  ownerId?: string;
  assignmentStatus?: StudentAssignmentStatus | "all" | string;
  lifecycleStatus?: StudentLifecycleStatus | "all" | string;
  sort?: "score" | "priority" | "lastActivityAt" | "nextActionDueAt" | string;
  order?: "asc" | "desc";
}

export interface DirectorStudentsSummary {
  trackedStudents?: number | null;
  trackedStudentsDeltaPercent?: number | null;
  highIntentStudents?: number | null;
  highIntentRate?: number | null;
  actionsDueToday?: number | null;
  averageEnrollmentProbability?: number | null;
  averageEnrollmentProbabilityDelta?: number | null;
}

export interface DirectorStudentsActionSummary {
  actionsDueToday?: number | null;
  decliningInteractionStudents?: number | null;
  familyReadyStudents?: number | null;
}

export interface DirectorStudentsMeta {
  total: number;
  totalAll: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  admissionYear: number;
  query?: string;
  filters?: {
    stage?: string;
    assignmentStatus?: string;
    lifecycleStatus?: string;
    province?: string;
  };
  sort?: {
    field?: string;
    order?: "asc" | "desc";
  };
  asOf?: string;
}

export interface DirectorStudentsResponse {
  data: StudentListItem[];
  summary: DirectorStudentsSummary;
  actionSummary: DirectorStudentsActionSummary;
  meta: DirectorStudentsMeta;
}

export interface FrappeMethodResponse<T> {
  message: T;
}
