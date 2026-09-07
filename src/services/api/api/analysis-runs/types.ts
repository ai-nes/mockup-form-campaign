export type AnalysisRunKind = "student" | "school";

export type AnalysisRunStatus =
  | "queued"
  | "running"
  | "completed"
  | "abstained"
  | "failed"
  | "dead_lettered";

export type AnalysisStageKind =
  | "student_360"
  | "next_best_action"
  | "school_360";

export type AnalysisClaimKind =
  | "fact"
  | "inference"
  | "uncertainty"
  | "recommendation";

/** Confidence is qualitative in the synchronous 360 response. */
export type AnalysisConfidence = number | string | null;

export type AnalysisVisibilityLabel = "shareable" | "source_scoped";

export interface AnalysisClaim {
  claimKind: AnalysisClaimKind;
  statement: string;
  provenanceIds: string[];
  visibilityLabel: AnalysisVisibilityLabel;
  confidence: AnalysisConfidence;
}

export type AnalysisReportItemKind = "risk" | "recommendation" | "opportunity";

export interface AnalysisReportItem {
  kind: AnalysisReportItemKind;
  code?: string | null;
  signalType?: string | null;
  severity?: string | null;
  strength?: string | null;
  /** Câu tiêu đề in đậm: nói thẳng mối lo hoặc việc cần làm. */
  headline: string;
  /** Đoạn "vì sao": đi từ bằng chứng tới kết luận. */
  detail: string;
  confidence: AnalysisConfidence;
  provenanceIds: string[];
}

export interface AnalysisAdvisorySignal {
  type: string;
  title: string;
  summary: string;
  confidence: AnalysisConfidence;
  evidenceRefs: string[];
}

export interface AnalysisRecentChange {
  type: string;
  summary: string;
  evidenceRefs: string[];
}

/** Báo cáo 360 đã được chuẩn hóa từ response của từng analysis stage. */
export interface AnalysisReport {
  title?: string | null;
  summary: string | null;
  risks: AnalysisReportItem[];
  recommendations: AnalysisReportItem[];
  /** New sync response: general signals that explain the current context. */
  advisorySignals?: AnalysisAdvisorySignal[];
  /** New sync response: opportunities are separate from recommendations. */
  opportunities?: AnalysisReportItem[];
  /** New sync response: material changes since the previous context. */
  recentChanges?: AnalysisRecentChange[];
  missingEvidence?: string[];
}

export interface AnalysisRunStage {
  id?: string;
  stageKind: AnalysisStageKind;
  status: AnalysisRunStatus;
  claims: AnalysisClaim[];
  report: AnalysisReport | null;
  terminalReason: string | null;
  policyRevision: string | null;
  modelRevision: string | null;
}

export interface AnalysisRunSnapshot {
  runId: string;
  runKind: AnalysisRunKind;
  receiptId?: string;
  status: AnalysisRunStatus;
  terminalReason?: string | null;
  stages: AnalysisRunStage[];
  sourceRevision?: number | null;
  sourceDigest?: string | null;
  expiresAt?: string | null;
  reusedExistingRun?: boolean;
}

export interface StudentAnalysisRunRequest {
  studentId: string;
  forceRerunReason?: string;
}

export interface SchoolAnalysisRunRequest {
  highSchool: string;
  admissionYear?: number;
  forceRerunReason?: string;
}

export type AnalysisRunRequest =
  | { kind: "student"; studentId: string; forceRerunReason?: string }
  | {
      kind: "school";
      highSchool: string;
      admissionYear?: number;
      forceRerunReason?: string;
    };
