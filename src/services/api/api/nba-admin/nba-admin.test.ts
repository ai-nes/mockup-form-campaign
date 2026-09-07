import { describe, expect, it, vi } from "vitest";

import { createTimingPolicy, previewRecommendationRule } from "./index";
import { normalizeRule, normalizeTimingPolicy } from "./normalizers";

describe("NBA admin API", () => {
  it("normalizes Timing Policy fields from Frappe Resource API", () => {
    expect(normalizeTimingPolicy({
      name: "FOLLOW_UP_24H",
      policy_key: "FOLLOW_UP_24H",
      trigger_type: "relative",
      delay_value: 24,
      delay_unit: "hours",
      time_slot: "6-12",
      recurrence_type: "none",
      optimization_enabled: 0,
    })).toMatchObject({
      name: "FOLLOW_UP_24H",
      policyKey: "FOLLOW_UP_24H",
      triggerType: "relative",
      delayValue: 24,
      timeSlot: "6-12",
      optimizationEnabled: false,
    });
  });

  it("normalizes Rule conditions and backend action alias", () => {
    expect(normalizeRule({
      name: "unaddressed_intent",
      rule_key: "unaddressed_intent",
      display_name: "Xử lý nhu cầu chưa được phản hồi",
      action: "CALL",
      conditions: JSON.stringify({ all: [{ field: "student.lifecycle_stage", operator: "in", value: ["Lead", "MQL"] }], any: [] }),
      stop_conditions: '["student_converted"]',
      status: "draft",
      version: 1,
    })).toMatchObject({
      actionCode: "CALL",
      conditions: { all: [{ field: "student.lifecycle_stage", operator: "in", value: ["Lead", "MQL"] }] },
      stopConditions: ["student_converted"],
    });
  });

  it("sends Timing Policy as a Resource API payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { name: "FOLLOW_UP_24H", policy_key: "FOLLOW_UP_24H", trigger_type: "relative" } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    try {
      await createTimingPolicy({ policyKey: "FOLLOW_UP_24H", triggerType: "relative", delayValue: 24, delayUnit: "hours", timeSlot: "6-12" }, { baseUrl: "http://frappe:8000" });
    } finally {
      vi.unstubAllGlobals();
    }
    expect(fetchMock.mock.calls[0][0]).toContain("/api/resource/CRM%20Timing%20Policy");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toMatchObject({ policy_key: "FOLLOW_UP_24H", delay_value: 24, time_slot: "6-12" });
  });

  it("sends Rule preview with structured rule and student context", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: { eligible: false, reason_code: "ACTION_DISABLED", warnings: [] } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    try {
      await previewRecommendationRule({ rule: { actionCode: "CALL", priority: "high", conditions: { all: [], any: [] } }, context: { student: "STU-0001", lifecycleStage: "Lead" } }, { baseUrl: "http://frappe:8000" });
    } finally {
      vi.unstubAllGlobals();
    }
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body).toMatchObject({ rule: { action_code: "CALL", priority: "high" }, context: { student: "STU-0001", lifecycle_stage: "Lead" } });
  });
});

