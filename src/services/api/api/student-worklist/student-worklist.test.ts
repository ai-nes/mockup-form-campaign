import { afterEach, describe, expect, it, vi } from "vitest";

import { getStudentWorklistActions, StudentWorklistApiError } from "./index";

afterEach(() => vi.restoreAllMocks());

describe("student worklist API contract", () => {
  it("calls the record actions endpoint and extracts objectives", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            items: [
              {
                name: "action-1",
                student: "STU-001",
                action_type: "CALL",
                objective: "Tư vấn học bổng",
                state: "pending",
                execution_status: "pending",
                priority: "high",
                due_at: "2026-09-03 10:00:00",
                action_owner: "Trần Minh Anh",
                origin: "AI",
                revision: 2,
                is_today: true,
                is_overdue: false,
              },
              { name: "action-2", objective: "" },
            ],
          },
        }),
        { status: 200 },
      ),
    );

    const result = await getStudentWorklistActions("STU-001", {
      baseUrl: "http://frappe:8000",
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.student_worklist.list_actions_for_record?doctype=CRM+Lead&name=STU-001&page_size=50",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(result.items).toEqual([
      expect.objectContaining({
        name: "action-1",
        actionType: "CALL",
        objective: "Tư vấn học bổng",
        priority: "high",
        actionOwner: "Trần Minh Anh",
        isToday: true,
      }),
    ]);
  });

  it("throws a typed error for an invalid response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: { items: null } }), {
        status: 200,
      }),
    );

    await expect(
      getStudentWorklistActions("STU-001", { baseUrl: "http://frappe:8000" }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<StudentWorklistApiError>>({
        status: 502,
        code: "INVALID_STUDENT_WORKLIST_RESPONSE",
      }),
    );
  });
});
