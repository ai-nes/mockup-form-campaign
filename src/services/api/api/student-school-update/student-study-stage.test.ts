import { describe, expect, it } from "vitest";

import {
  deriveStudentStudyStage,
  getStudentStudyStageForPayload,
} from "./student-study-stage";

describe("student grade and study stage mapping", () => {
  it.each([
    ["10", undefined, "grade_10"],
    ["11", undefined, "grade_11"],
    ["post_exam", undefined, "post_exam"],
    ["12", "grade_12_h1", "grade_12_h1"],
    ["12", "grade_12_h2", "grade_12_h2"],
  ])("maps %s/%s to %s", (currentGrade, studyStage, expected) => {
    expect(getStudentStudyStageForPayload(currentGrade, studyStage)).toBe(
      expected,
    );
  });

  it("omits the stage when grade 12's semester is unknown", () => {
    expect(getStudentStudyStageForPayload("12")).toBeUndefined();
    expect(getStudentStudyStageForPayload("12", "grade_10")).toBeUndefined();
  });

  it("derives the semester from the display value returned by Student 360", () => {
    expect(deriveStudentStudyStage("Lớp 12 · học kỳ 2")).toBe("grade_12_h2");
    expect(deriveStudentStudyStage("grade_12_h1")).toBe("grade_12_h1");
  });
});
