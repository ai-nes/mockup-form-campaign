import { afterEach, describe, expect, it, vi } from "vitest";

import {
  applyActionCommand,
  camelizeKeys,
  getDirectorNextBestAction,
  normalizeDirectorNextBestAction,
  normalizePackageSeed,
} from "./index";

afterEach(() => vi.restoreAllMocks());

const snapshot = {
  meta: {
    admissionYear: 2026,
    scope: "all",
    scopeLabel: "Toàn bộ cơ sở",
    asOf: "2026-09-01T09:00:00+07:00",
    timezone: "Asia/Ho_Chi_Minh",
    status: "available",
    aiStatus: "available",
    modelVersion: null,
    policyVersion: "action-policy-2026.08",
    warnings: null,
  },
  queue: {
    actions: [
      {
        id: "REC-001",
        studentId: "STU-001",
        studentName: "Nguyễn Văn A",
        initials: "NA",
        schoolId: "SCH-001",
        school: "THPT Trưng Vương",
        interest: "Công nghệ thông tin",
        recommendationCode: "CALL",
        recommendation: "Gọi phụ huynh",
        summary: "Hồ sơ cần được liên hệ lại.",
        dueAt: "2026-09-01T12:00:00+07:00",
        dueLabel: "Xử lý hôm nay",
        status: "today",
        priority: "high",
        impact: "Tăng khả năng chuyển bước",
        currentProbability: 54,
        projectedProbability: 68,
        confidence: 82,
        suggestedAssigneeId: "STAFF-001",
        suggestedAssignee: "Trần B",
        evidence: ["Đã xem thông tin ngành"],
        talkingPoints: ["Xác nhận nhu cầu tư vấn"],
        recentActivity: [],
        controlLevel: "review",
        state: "proposed",
        generatedAt: "2026-09-01T08:00:00+07:00",
        expiresAt: "2026-09-02T08:00:00+07:00",
        version: 0,
      },
    ],
    counts: { all: 1, urgent: 1, today: 1, overdue: 0, soon: 0 },
    pagination: { page: 1, pageSize: 20, total: 1, hasNext: false },
  },
  sla: {
    responseWindowHours: 8,
    onTimeRate: null,
    onTimeDetail: "Mốc phản hồi 8 giờ làm việc",
    statusBuckets: [
      {
        id: "within-sla",
        label: "Còn trong hạn",
        count: 1,
        share: 100,
        detail: "Có thể xử lý theo lịch hiện tại",
        tone: "success",
      },
      {
        id: "due-soon",
        label: "Sắp đến hạn",
        count: 0,
        share: 0,
        detail: "Còn dưới 60 phút trước mốc phản hồi",
        tone: "warning",
      },
      {
        id: "overdue",
        label: "Đã quá hạn",
        count: 0,
        share: 0,
        detail: "Cần điều phối ngay",
        tone: "error",
      },
    ],
    riskCases: [],
    riskReasons: [],
  },
  outcomes: {
    period: "30d",
    rows: [
      {
        id: "call",
        label: "Gọi phụ huynh",
        submitted: 1,
        accepted: 1,
        executed: 1,
        progressed: 1,
        transitionRate: 100,
      },
    ],
  },
  controlPolicy: {
    version: "action-policy-2026.08",
    rows: [
      {
        level: "review",
        label: "Cần kiểm tra",
        actionTypes: ["assign"],
        detail: "Giao việc",
        execution: "business-rule",
      },
    ],
  },
};

describe("director next best action API contract", () => {
  it("normalizes the Frappe snapshot envelope", () => {
    const result = normalizeDirectorNextBestAction({ message: snapshot });

    expect(result.meta.status).toBe("available");
    expect(result.queue.actions[0]?.version).toBe(0);
    expect(result.sla.statusBuckets[0]?.count).toBe(1);
  });

  it("passes queue parameters to GET and idempotency data to POST", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: snapshot }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: {
              actionId: "REC-001",
              command: "assign",
              state: "assigned",
              version: 1,
              appliedAt: "2026-09-01T09:00:00+07:00",
              deferUntil: null,
              replayed: false,
              audit: {
                eventId: "EVT-001",
                actorId: "staff-1",
                occurredAt: "2026-09-01T09:00:00+07:00",
              },
            },
          }),
          { status: 200 },
        ),
      );

    await getDirectorNextBestAction(
      { queueFilter: "urgent", page: 1, pageSize: 20, outcomePeriod: "30d" },
      { baseUrl: "http://frappe:8000" },
    );
    await applyActionCommand(
      {
        actionId: "REC-001",
        command: "assign",
        assigneeId: "STAFF-001",
        expectedVersion: 0,
        idempotencyKey: "director-nba:test-1",
      },
      { baseUrl: "http://frappe:8000" },
    );

    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      "http://frappe:8000/api/method/crm.api.director_next_best_action.get_director_next_best_action?queueFilter=urgent&page=1&pageSize=20&outcomePeriod=30d",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(fetchSpy.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          actionId: "REC-001",
          command: "assign",
          assigneeId: "STAFF-001",
          expectedVersion: 0,
          idempotencyKey: "director-nba:test-1",
        }),
      }),
    );
    expect((fetchSpy.mock.calls[1]?.[1] as RequestInit).headers).toEqual(
      expect.objectContaining({
        "Idempotency-Key": "director-nba:test-1",
      }),
    );
  });
});

describe("per-type action card fields", () => {
  it("keeps an older payload without the additive fields valid", () => {
    const result = normalizeDirectorNextBestAction({ message: snapshot });
    const action = result.queue.actions[0];

    expect(action?.actionType).toBeNull();
    expect(action?.disposition).toBe("ACT");
    expect(action?.packageSeed).toBeNull();
    expect(action?.whyNow).toBeNull();
    expect(action?.evidenceRefIds).toEqual([]);
  });

  it("surfaces the typed package and rationale when present", () => {
    const enriched = structuredClone(snapshot);
    enriched.queue.actions[0] = {
      ...enriched.queue.actions[0],
      actionType: "DOCUMENT_REQUEST",
      disposition: "ACT",
      packageSeed: {
        missingDocuments: ["CCCD", "Học bạ"],
        deadline: "Còn 2 ngày",
        requestMessage: "Vui lòng bổ sung giấy tờ còn thiếu.",
      },
      whyNow: "Hạn nộp còn 2 ngày",
      approach: "Nhắn tin kèm checklist",
      expectedOutcome: "Nhận đủ giấy tờ trước hạn",
      evidenceRefIds: ["EV-1"],
    } as (typeof enriched.queue.actions)[0];

    const action = normalizeDirectorNextBestAction({ message: enriched }).queue
      .actions[0];

    expect(action?.actionType).toBe("DOCUMENT_REQUEST");
    expect(action?.packageSeed?.missingDocuments).toEqual(["CCCD", "Học bạ"]);
    expect(action?.whyNow).toBe("Hạn nộp còn 2 ngày");
    expect(action?.evidenceRefIds).toEqual(["EV-1"]);
  });

  it("rejects an unknown actionType and drops an empty seed", () => {
    const enriched = structuredClone(snapshot);
    enriched.queue.actions[0] = {
      ...enriched.queue.actions[0],
      actionType: "NOT_A_TYPE",
      packageSeed: { objective: "", notes: 5 },
    } as (typeof enriched.queue.actions)[0];

    const action = normalizeDirectorNextBestAction({ message: enriched }).queue
      .actions[0];

    expect(action?.actionType).toBeNull();
    expect(action?.packageSeed).toBeNull();
  });

  it("camelizes a snake_case seed key defensively", () => {
    expect(camelizeKeys({ talking_points: ["a"], objective: "o" })).toEqual({
      talkingPoints: ["a"],
      objective: "o",
    });
    expect(
      normalizePackageSeed({ missing_documents: ["CCCD"], blank: "  " }),
    ).toEqual({ missingDocuments: ["CCCD"] });
  });
});
