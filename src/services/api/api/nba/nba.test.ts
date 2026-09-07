import { afterEach, describe, expect, it, vi } from "vitest";

import {
  decideNbaRecommendation,
  getDirectorNbaRecommendations,
  getStudentNbaWorklist,
  NbaApiError,
  runStudentNbaEvaluation,
} from "./index";

afterEach(() => vi.restoreAllMocks());

describe("NBA review API contract", () => {
  it("loads the director recommendation queue without exposing kernel scores", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            meta: {
              admissionYear: 2026,
              asOf: "2026-09-04T13:41:14+07:00",
              timezone: "Asia/Ho_Chi_Minh",
              status: "available",
              count: 1,
              limit: 50,
              metricKind: "observational",
              metricDisclaimer:
                "Số liệu mô tả trạng thái lịch sử, không phải dự báo.",
            },
            recommendations: [
              {
                id: "eval-1-1",
                target: { type: "CRM Lead", id: "ENR-2026-00002" },
                action: {
                  code: "ACTIVATE_WINBACK",
                  title: "Kích hoạt lại quan tâm",
                },
                rank: 1,
                recommendationKey: "NBAEVAL-1:ACTIVATE_WINBACK:1",
                studentId: "ENR-2026-00002",
                actionId: "ACTIVATE_WINBACK",
                priority: "high",
                channel: null,
                reason: "Chưa có liên lạc trong 5 ngày.",
                objective: "Khôi phục liên hệ với học viên.",
                context: ["Chưa có liên lạc trong 5 ngày."],
                timing: {
                  scheduled_at: "2026-09-05T09:00:00+07:00",
                  expires_at: "2026-09-10 18:00:00",
                  timezone: "Asia/Ho_Chi_Minh",
                },
                status: {
                  lifecycle: "proposed",
                  decision: "pending",
                  execution: "not_started",
                },
                aiPayload: { score: 0.8, score_band: "cao" },
                explanation: null,
                explanationSource: null,
                evaluation: {
                  id: "eval-1",
                  disposition: "RECOMMEND",
                  status: "completed",
                },
                generatedAt: "2026-09-04T13:41:14+07:00",
              },
            ],
          },
        }),
        { status: 200 },
      ),
    );

    const result = await getDirectorNbaRecommendations(
      { limit: 50 },
      { baseUrl: "http://frappe:8000" },
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.director_next_best_action.get_director_recommendations?limit=50",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(result.meta.metricKind).toBe("observational");
    expect(result.recommendations[0]).toEqual(
      expect.objectContaining({
        studentId: "ENR-2026-00002",
        actionId: "ACTIVATE_WINBACK",
        expectedRevision: null,
      }),
    );
    expect(result.recommendations[0]?.aiPayload.score).toBe(0.8);
    expect(result.recommendations[0]).toEqual(
      expect.objectContaining({
        target: { type: "CRM Lead", id: "ENR-2026-00002" },
        action: { code: "ACTIVATE_WINBACK", title: "Kích hoạt lại quan tâm" },
        objective: "Khôi phục liên hệ với học viên.",
        context: ["Chưa có liên lạc trong 5 ngày."],
        timing: {
          scheduledAt: "2026-09-05T09:00:00+07:00",
          expiresAt: "2026-09-10 18:00:00",
          timezone: "Asia/Ho_Chi_Minh",
        },
        status: {
          lifecycle: "proposed",
          decision: "pending",
          execution: "not_started",
        },
      }),
    );
  });

  it("keeps a director row without inventing a missing short reason", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            meta: {
              admissionYear: 2026,
              asOf: "2026-09-04T13:41:14+07:00",
              timezone: "Asia/Ho_Chi_Minh",
              status: "available",
              count: 1,
              limit: 50,
              metricKind: "observational",
              metricDisclaimer: "Mô tả lịch sử.",
            },
            recommendations: [
              {
                id: "eval-2-1",
                rank: 1,
                studentId: "ENR-2026-00003",
                actionId: "HANDOFF",
                aiPayload: {},
                explanation: {
                  action: {
                    code: "HANDOFF",
                    title: "Chuyển giao phụ trách",
                  },
                  summary: "Cần chuyển giao để tiếp tục theo dõi.",
                  why_action: "Thông tin cần được chuyển tới người phù hợp.",
                  why_now: "Có tín hiệu mới cần phản hồi.",
                  evidence: [],
                  uncertainty: "Chưa rõ người nhận cuối cùng.",
                  timing: {
                    recommended_at: "2026-09-04T18:30:00+07:00",
                    reason: "Xử lý trong phiên làm việc hiện tại.",
                  },
                },
                evaluation: {
                  id: "eval-2",
                  disposition: "RECOMMEND",
                  status: "completed",
                },
                generatedAt: "2026-09-04T13:41:14+07:00",
              },
            ],
          },
        }),
        { status: 200 },
      ),
    );

    const result = await getDirectorNbaRecommendations(
      {},
      { baseUrl: "http://frappe:8000" },
    );

    expect(result.recommendations[0]?.reason).toBeNull();
  });

  it("loads the canonical student worklist and normalizes wire names", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            items: [
              {
                id: "eval-1-1",
                rank: 1,
                recommendationKey: "NBAEVAL-1:ACTIVATE_WINBACK:1",
                studentId: "ENR-2026-00002",
                studentName: "Nguyễn Văn A",
                actionId: "ACTIVATE_WINBACK",
                priority: "high",
                channel: null,
                reason: "Chưa có liên lạc trong 5 ngày.",
                aiPayload: { score: 0.8, timing_window: "today" },
                explanation: {
                  action: {
                    code: "ACTIVATE_WINBACK",
                    title: "Kích hoạt lại quan tâm",
                  },
                  summary: "Nên kích hoạt lại liên hệ.",
                  why_action: "Giúp khôi phục tương tác.",
                  why_now: "Tín hiệu đang giảm.",
                  evidence: [
                    {
                      summary: "Không có liên lạc trong 5 ngày.",
                      evidence_ref: "INT-845",
                    },
                  ],
                  uncertainty: "Chưa rõ mức độ ưu tiên.",
                  timing: {
                    recommended_at: "2026-09-04T18:30:00+07:00",
                    reason: "Nên thực hiện trong hôm nay.",
                  },
                },
                explanationSource: "model",
                evaluation: {
                  id: "eval-1",
                  disposition: "RECOMMEND",
                  status: "completed",
                },
                generatedAt: "2026-09-04 13:41:14",
                expected_revision: "2026-09-04 13:41:14.512345",
                revision: "r1",
                permitted_decisions: ["accepted", "deferred", "rejected"],
              },
            ],
            next_cursor: "next-page",
            policy_version: "recommendation-worklist-v1",
          },
        }),
        { status: 200 },
      ),
    );

    const result = await getStudentNbaWorklist(
      { pageSize: 20, studentId: "ENR-2026-00002" },
      { baseUrl: "http://frappe:8000" },
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.student_worklist.list_student_worklist?page_size=20&student_id=ENR-2026-00002",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        id: "eval-1-1",
        studentId: "ENR-2026-00002",
        actionId: "ACTIVATE_WINBACK",
        expectedRevision: "2026-09-04 13:41:14.512345",
        permittedDecisions: ["accepted", "deferred", "rejected"],
        explanation: expect.objectContaining({
          summary: "Nên kích hoạt lại liên hệ.",
        }),
      }),
    );
    expect(result.nextCursor).toBe("next-page");
  });

  it("sends the CAS revision and idempotency key on decisions", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            status: "accepted",
            operation: "ACCEPT",
            recommendation: "eval-1-1",
            action: "ACT-2026-00009",
            event: "event-1",
            receipt: "receipt-1",
          },
        }),
        { status: 200 },
      ),
    );

    await decideNbaRecommendation(
      {
        name: "eval-1-1",
        expectedRevision: "revision-1",
        operation: "ACCEPT_WITH_CHANGES",
        idempotencyKey: "decide:eval-1-1:accept:request-1",
        delta: { priority: "high", channel: "Điện thoại" },
      },
      { baseUrl: "http://frappe:8000" },
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.student_decision.decide_recommendation",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "eval-1-1",
          expected_revision: "revision-1",
          operation: "ACCEPT_WITH_CHANGES",
          idempotency_key: "decide:eval-1-1:accept:request-1",
          delta: { priority: "high", channel: "Điện thoại" },
        }),
      }),
    );
    expect((fetchSpy.mock.calls[0]?.[1] as RequestInit).headers).toEqual(
      expect.objectContaining({
        "Idempotency-Key": "decide:eval-1-1:accept:request-1",
      }),
    );
  });

  it("runs a caller-scoped NBA evaluation through the Frappe proxy", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            evaluation: "eval-2",
            student_id: "ENR-2026-00002",
            status: "completed",
            disposition: "RECOMMEND",
            recommendation_count: 1,
            terminal_reason: null,
            recommendations: [
              {
                id: "eval-2-1",
                rank: 1,
                recommendationKey: "NBAEVAL-2:ACTIVATE_WINBACK:1",
                studentId: "ENR-2026-00002",
                actionId: "ACTIVATE_WINBACK",
                priority: "high",
                channel: "NONE",
                reason: "Chưa có liên lạc trong 5 ngày.",
                aiPayload: {
                  explanation_facts: ["Còn 26 ngày đến hạn tiếp theo."],
                },
                explanation: {
                  action: {
                    code: "ACTIVATE_WINBACK",
                    title: "Kích hoạt lại quan tâm",
                  },
                  summary: "Nên kích hoạt lại liên hệ.",
                  why_action: "Giúp khôi phục tương tác.",
                  why_now: "Tín hiệu đang giảm.",
                  evidence: [
                    {
                      summary: "Không có liên lạc trong 5 ngày.",
                      evidence_ref: "INT-845",
                    },
                  ],
                  uncertainty:
                    "Chưa rõ mức độ ưu tiên của lần tương tác trước.",
                  timing: {
                    recommended_at: "2026-09-04T18:30:00+07:00",
                    reason: "Nên thực hiện trong hôm nay.",
                  },
                },
                explanationSource: "model",
                evaluation: {
                  id: "eval-2",
                  disposition: "RECOMMEND",
                  status: "completed",
                },
                generatedAt: "2026-09-04T13:41:14+07:00",
              },
            ],
          },
        }),
        { status: 200 },
      ),
    );

    const result = await runStudentNbaEvaluation(
      { studentId: "ENR-2026-00002" },
      { baseUrl: "http://frappe:8000" },
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.copilot_delegation.run_student_nba_evaluation",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ student_id: "ENR-2026-00002" }),
      }),
    );
    expect((fetchSpy.mock.calls[0]?.[1] as RequestInit).headers).toEqual(
      expect.objectContaining({
        "Idempotency-Key": expect.stringMatching(/^run-nba:ENR-2026-00002:/),
      }),
    );
    expect(result).toEqual({
      evaluation: "eval-2",
      studentId: "ENR-2026-00002",
      status: "completed",
      disposition: "RECOMMEND",
      recommendationCount: 1,
      terminalReason: null,
      recommendations: [
        expect.objectContaining({
          id: "eval-2-1",
          explanation: expect.objectContaining({
            summary: "Nên kích hoạt lại liên hệ.",
          }),
        }),
      ],
    });
  });

  it("preserves stale revision errors for the UI to handle", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "STALE_REVISION",
            message: "Recommendation changed since read",
          },
        }),
        { status: 409 },
      ),
    );

    await expect(
      decideNbaRecommendation(
        {
          name: "eval-1-1",
          expectedRevision: "old-revision",
          operation: "ACCEPT",
          idempotencyKey: "decide:eval-1-1:accept:request-2",
        },
        { baseUrl: "http://frappe:8000" },
      ),
    ).rejects.toEqual(
      expect.objectContaining<Partial<NbaApiError>>({
        status: 409,
        code: "STALE_REVISION",
      }),
    );
  });

  it("normalizes Frappe permission exception codes", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          exception:
            "frappe.exceptions.PermissionError: OUT_OF_SCOPE: The executor is outside the Student's current owner/team scope.",
        }),
        { status: 403 },
      ),
    );

    await expect(
      decideNbaRecommendation(
        {
          name: "eval-1-1",
          expectedRevision: "revision-1",
          operation: "ACCEPT",
          idempotencyKey: "decide:eval-1-1:accept:scope-error",
        },
        { baseUrl: "http://frappe:8000" },
      ),
    ).rejects.toEqual(
      expect.objectContaining<Partial<NbaApiError>>({
        status: 403,
        code: "OUT_OF_SCOPE",
      }),
    );
  });
});
