export type StudentCurrentGrade = "10" | "11" | "12" | "post_exam";

export type StudentStudyStage =
  | "grade_10"
  | "grade_11"
  | "grade_12_h1"
  | "grade_12_h2"
  | "post_exam";

export const studentStudyStageOptions = [
  { id: "", label: "Chưa xác định" },
  { id: "grade_12_h1", label: "Học kỳ 1 lớp 12" },
  { id: "grade_12_h2", label: "Học kỳ 2 lớp 12" },
];

const fixedStudyStages: Partial<
  Record<StudentCurrentGrade, StudentStudyStage>
> = {
  "10": "grade_10",
  "11": "grade_11",
  post_exam: "post_exam",
};

export function normalizeStudentCurrentGrade(
  value: string | null | undefined,
): StudentCurrentGrade | undefined {
  const normalizedValue = value?.trim().toLowerCase();
  if (
    normalizedValue === "10" ||
    normalizedValue === "11" ||
    normalizedValue === "12" ||
    normalizedValue === "post_exam"
  ) {
    return normalizedValue;
  }

  return undefined;
}

export function normalizeStudentStudyStage(
  value: string | null | undefined,
): StudentStudyStage | undefined {
  const normalizedValue = value?.trim().toLowerCase();
  if (
    normalizedValue === "grade_10" ||
    normalizedValue === "grade_11" ||
    normalizedValue === "grade_12_h1" ||
    normalizedValue === "grade_12_h2" ||
    normalizedValue === "post_exam"
  ) {
    return normalizedValue;
  }

  return undefined;
}

/**
 * Resolves the only study stage that can safely be sent for a grade.
 * Grade 12 intentionally returns undefined until H1/H2 is known.
 */
export function getStudentStudyStageForPayload(
  currentGrade: string | null | undefined,
  studyStage?: string | null,
): StudentStudyStage | undefined {
  const normalizedGrade = normalizeStudentCurrentGrade(currentGrade);
  if (!normalizedGrade) return undefined;

  if (normalizedGrade !== "12") {
    return fixedStudyStages[normalizedGrade];
  }

  const normalizedStage = normalizeStudentStudyStage(studyStage);
  return normalizedStage === "grade_12_h1" || normalizedStage === "grade_12_h2"
    ? normalizedStage
    : undefined;
}

export function deriveStudentStudyStage(
  value: string | null | undefined,
): StudentStudyStage | undefined {
  const normalizedValue = value?.trim().toLowerCase() ?? "";
  const directStage = normalizeStudentStudyStage(normalizedValue);
  if (directStage) return directStage;
  if (/học kỳ\s*1|học kỳ\s*h1|\bh1\b/.test(normalizedValue)) {
    return "grade_12_h1";
  }
  if (/học kỳ\s*2|học kỳ\s*h2|\bh2\b/.test(normalizedValue)) {
    return "grade_12_h2";
  }
  if (/sau kỳ thi|post[-_ ]?exam/.test(normalizedValue)) {
    return "post_exam";
  }
  if (/lớp\s*10|grade[_ -]?10/.test(normalizedValue)) {
    return "grade_10";
  }
  if (/lớp\s*11|grade[_ -]?11/.test(normalizedValue)) {
    return "grade_11";
  }

  return undefined;
}

export function getStudentStudyStageLabel(
  stage: string | null | undefined,
  currentGrade: string | null | undefined,
) {
  switch (normalizeStudentStudyStage(stage)) {
    case "grade_12_h1":
      return "Học kỳ 1 lớp 12";
    case "grade_12_h2":
      return "Học kỳ 2 lớp 12";
    case "grade_10":
      return "Lớp 10";
    case "grade_11":
      return "Lớp 11";
    case "post_exam":
      return "Sau kỳ thi";
    default:
      return normalizeStudentCurrentGrade(currentGrade) === "12"
        ? "Chưa xác định"
        : "-";
  }
}
