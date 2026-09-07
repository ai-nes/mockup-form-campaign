import { afterEach, describe, expect, it, vi } from "vitest";

import { getAnalysisRun, normalizeAnalysisRun, requestAnalysisRun } from "./index";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("analysis run API contract", () => {
  it("renders Frappe visible claims from its compact wire schema", () => {
    const result = normalizeAnalysisRun(
      {
        message: {
          run_id: "f1dsd4tpuh",
          run_type: "CRM Student Analysis Run",
          status: "completed",
          stages: [
            {
              name: "stage-1",
              stage_kind: "student_360",
              status: "completed",
              claims: [
                {
                  kind: "fact",
                  text: "Hồ sơ đang ở giai đoạn Applicant.",
                  provenance_ids: ["student:ENR-2026-07553"],
                  visibility: "shareable",
                },
              ],
            },
          ],
        },
      },
      "student",
    );

    expect(result.stages[0]?.claims).toEqual([
      {
        claimKind: "fact",
        statement: "Hồ sơ đang ở giai đoạn Applicant.",
        provenanceIds: ["student:ENR-2026-07553"],
        visibilityLabel: "shareable",
        confidence: null,
      },
    ]);
  });

  it("normalizes the three-block report and folds the legacy envelope", () => {
    const result = normalizeAnalysisRun(
      {
        message: {
          run_id: "run-360",
          run_type: "CRM School Analysis Run",
          status: "completed",
          stages: [
            {
              stage_kind: "school_360",
              status: "completed",
              claims: [],
              report_json: JSON.stringify({
                title: "Trường tiềm năng cao, chuyển đổi đang chững",
                executive_summary: "Trường cần bổ sung dữ liệu nền.",
                risks: [
                  {
                    headline: "Chuyển đổi chững lại",
                    detail: "Hồ sơ dừng ở bước tương tác.",
                    confidence: 0.8,
                    provenance_ids: ["school:237-82"],
                  },
                ],
                recommended_actions: [
                  { action: "Xác minh đầu mối liên hệ.", next_step: "Gọi cho hiệu phó." },
                ],
                opportunities: [{ title: "Tổ chức Parent Session" }],
                missing_evidence: ["Mối quan hệ liên kết"],
              }),
            },
          ],
        },
      },
      "school",
    );

    const report = result.stages[0]?.report;
    expect(report?.summary).toBe("Trường cần bổ sung dữ liệu nền.");
    expect(report?.risks[0]).toMatchObject({ kind: "risk", headline: "Chuyển đổi chững lại" });
    expect(report?.recommendations[0]).toMatchObject({ kind: "recommendation" });
    expect(report?.recommendations.at(-1)).toMatchObject({ kind: "opportunity" });
    expect(report?.missingEvidence).toEqual(["Mối quan hệ liên kết"]);
  });

  it("normalizes visible_claims without hiding the stage response", () => {
    const result = normalizeAnalysisRun(
      {
        message: {
          run_id: "run-visible-claims",
          status: "completed",
          stages: [
            {
              stage_kind: "student_360",
              status: "completed",
              visible_claims: [
                {
                  kind: "inference",
                  text: "Học sinh cần được tư vấn thêm về chi phí.",
                  provenance_ids: ["student:STU-1"],
                  visibility: "shareable",
                },
              ],
            },
          ],
        },
      },
      "student",
    );

    expect(result.stages[0]?.claims).toHaveLength(1);
    expect(result.stages[0]?.claims[0]?.statement).toBe(
      "Học sinh cần được tư vấn thêm về chi phí.",
    );
  });

  it("keeps a completed 360 stage from a partial HTTP 400 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            message: {
              run_id: "partial-run",
              run_type: "CRM Student Analysis Run",
              status: "abstained",
              stages: [
                {
                  stage_kind: "next_best_action",
                  status: "abstained",
                  claims: [],
                },
                {
                  stage_kind: "student_360",
                  status: "completed",
                  claims: [],
                  report: {
                    summary: "Đã có báo cáo Student 360.",
                  },
                },
              ],
            },
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const result = await requestAnalysisRun({
      kind: "student",
      studentId: "ENR-2026-00299",
    }, { baseUrl: "http://frappe.test" });

    expect(result.runId).toBe("partial-run");
    expect(result.stages[1]?.report?.summary).toBe(
      "Đã có báo cáo Student 360.",
    );
  });

  it("routes Student 360 through the Frappe BFF by default", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          run_id: "proxy-student-run",
          student_id: "ENR-2026-00003",
          status: "completed",
          report: null,
          terminal_reason: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await requestAnalysisRun(
      { kind: "student", studentId: "ENR-2026-00003" },
      {
        baseUrl: "http://frappe.test",
        idempotencyKey: "dashboard-student:proxy-test",
      },
    );

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "http://frappe.test/api/method/crm.api.copilot_delegation.run_student_analysis",
    );
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
      "Idempotency-Key": "dashboard-student:proxy-test",
    });
    expect(init.headers).not.toHaveProperty("X-API-Key");
  });

  it("calls the synchronous Student 360 endpoint and normalizes its flat report", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          run_id: "sync-student-run",
          student_id: "ENR-2026-00003",
          status: "completed",
          report: {
            advisory_signals: [
              {
                type: "Academic Readiness",
                title: "Kết quả học tập lớp 12 đạt hạn cao",
                summary: "Nền tảng học tập đang phù hợp với ngành đã chọn.",
                confidence: "HIGH",
                evidence_refs: ["score:SCH-2026-00003"],
              },
            ],
            risks: [
              {
                code: "INCOMPLETE_DOCS",
                severity: "LOW",
                title: "Còn thiếu tài liệu hồ sơ",
                summary: "Cần bổ sung giấy tờ trước khi chốt hồ sơ.",
                evidence_refs: ["application:APP-2026-00001"],
              },
            ],
            opportunity_signals: [
              {
                code: "HIGH_FIT_INTEREST",
                strength: "HIGH",
                title: "Mức độ phù hợp cao",
                summary: "Có thể ưu tiên tư vấn bước tiếp theo.",
                evidence_refs: ["score:SCH-2026-00003"],
              },
            ],
            recent_changes: [
              {
                type: "Lifecycle Progression",
                summary: "Hồ sơ đã chuyển sang Applicant.",
                evidence_refs: ["lifecycle:run-1"],
              },
            ],
          },
          terminal_reason: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await requestAnalysisRun(
      { kind: "student", studentId: "ENR-2026-00003" },
      {
        baseUrl: "http://agents.test",
        transport: "agents",
        apiKey: "api-key",
        authorization: "oauth-token",
        delegationProof: "delegation-proof",
        idempotencyKey: "dashboard-student:sync-test",
      },
    );

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://agents.test/api/v1/analysis-runs/student/run");
    expect(init.headers).toMatchObject({
      "X-API-Key": "api-key",
      Authorization: "Bearer oauth-token",
      "X-Frappe-Delegation": "delegation-proof",
      "Idempotency-Key": "dashboard-student:sync-test",
    });
    expect(JSON.parse(String(init.body))).toEqual({
      student_id: "ENR-2026-00003",
    });
    expect(result.status).toBe("completed");
    expect(result.stages[0]?.stageKind).toBe("student_360");
    expect(result.stages[0]?.report?.advisorySignals?.[0]).toMatchObject({
      type: "Academic Readiness",
      confidence: "HIGH",
      evidenceRefs: ["score:SCH-2026-00003"],
    });
    expect(result.stages[0]?.report?.risks[0]).toMatchObject({
      code: "INCOMPLETE_DOCS",
      severity: "LOW",
    });
    expect(result.stages[0]?.report?.opportunities?.[0]).toMatchObject({
      code: "HIGH_FIT_INTEREST",
      strength: "HIGH",
    });
    expect(result.stages[0]?.report?.recentChanges?.[0]?.type).toBe(
      "Lifecycle Progression",
    );
  });

  it("calls the synchronous School 360 endpoint and keeps terminal reasons retryable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            run_id: "sync-school-run",
            high_school: "01-001-062",
            status: "abstained",
            report: null,
            terminal_reason: "insufficient_evidence",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const result = await requestAnalysisRun(
      {
        kind: "school",
        highSchool: "01-001-062",
        admissionYear: 2026,
        forceRerunReason: "Dữ liệu quan hệ trường vừa được cập nhật",
      },
      { baseUrl: "http://agents.test", transport: "agents" },
    );

    const fetchMock = vi.mocked(fetch);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://agents.test/api/v1/analysis-runs/school/run");
    expect(JSON.parse(String(init.body))).toEqual({
      high_school: "01-001-062",
      admission_year: 2026,
      force_rerun_reason: "Dữ liệu quan hệ trường vừa được cập nhật",
    });
    expect(result.status).toBe("abstained");
    expect(result.terminalReason).toBe("insufficient_evidence");
    expect(result.stages[0]?.stageKind).toBe("school_360");
    expect(result.stages[0]?.report).toBeNull();
  });

  it("reads a settled run from the new history endpoint with run_kind", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          run_id: "history-school-run",
          high_school: "01-001-062",
          status: "completed",
          report: {
            advisory_signals: [],
            risks: [],
            opportunity_signals: [],
            recent_changes: [],
          },
          terminal_reason: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getAnalysisRun("history-school-run", "school", {
      baseUrl: "http://frappe.test",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://frappe.test/api/method/crm.api.copilot_delegation.get_analysis_run?run_kind=school&run_id=history-school-run",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(result.runKind).toBe("school");
    expect(result.stages[0]?.stageKind).toBe("school_360");
  });
});
