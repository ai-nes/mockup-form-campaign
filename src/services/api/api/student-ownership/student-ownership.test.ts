import { afterEach, describe, expect, it, vi } from "vitest";

import {
  assignStudentToSales,
  getAssignableSales,
  StudentOwnershipApiError,
} from "./index";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("student ownership API contract", () => {
  it("loads eligible Sale and CTV Sale candidates for a student", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            owners: [
              {
                name: "STAFF-CTV",
                label: "CTV Sale A",
                team: "TEAM-1",
                campus: "CAMPUS-1",
              },
            ],
          },
        }),
        { status: 200 },
      ),
    );

    const result = await getAssignableSales("STUDENT-1", "ctv", {
      baseUrl: "http://frappe:8000",
    });

    expect(result.sales[0]?.name).toBe("STAFF-CTV");
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.student_ownership.get_eligible_ownership_targets?student=STUDENT-1",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("posts an owner assignment with the command metadata", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: { status: "applied", studentId: "STUDENT-1" },
        }),
        { status: 200 },
      ),
    );

    await assignStudentToSales(
      {
        studentId: "STUDENT-1",
        ownerId: "STAFF-CTV",
        reason: "Phân công thủ công cho CTV Sale",
        expectedRevision: 4,
        idempotencyKey: "assign-student-001",
        correlationId: "manual-assign-001",
        targetTeamId: "TEAM-1",
      },
      { baseUrl: "http://frappe:8000" },
    );

    const [url, init] = fetchSpy.mock.calls[0] ?? [];
    expect(url).toBe(
      "http://frappe:8000/api/method/crm.api.student_ownership.change_student_ownership",
    );
    expect(init).toEqual(
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "Idempotency-Key": "assign-student-001",
        }),
      }),
    );
    expect(JSON.parse(String(init?.body))).toEqual({
      student: "STUDENT-1",
      target_kind: "owner",
      target_id: "STAFF-CTV",
      reason: "Phân công thủ công cho CTV Sale",
      expected_revision: 4,
      idempotency_key: "assign-student-001",
      correlation_id: "manual-assign-001",
      target_team_id: "TEAM-1",
    });
  });

  it("rejects an invalid candidate response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: { owners: null } }), {
        status: 200,
      }),
    );

    await expect(
      getAssignableSales("STUDENT-1", "", { baseUrl: "http://frappe:8000" }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<StudentOwnershipApiError>>({
        status: 502,
        code: "INVALID_ASSIGNABLE_SALES_RESPONSE",
      }),
    );
  });

  it("requires the revision and target team for an owner command", async () => {
    await expect(
      assignStudentToSales(
        {
          studentId: "STUDENT-1",
          ownerId: "STAFF-CTV",
          reason: "Phân công thủ công",
          expectedRevision: -1,
          idempotencyKey: "assign-student-001",
          correlationId: "manual-assign-001",
          targetTeamId: "",
        },
        { baseUrl: "http://frappe:8000" },
      ),
    ).rejects.toEqual(
      expect.objectContaining<Partial<StudentOwnershipApiError>>({
        status: 400,
        code: "INVALID_PAYLOAD",
      }),
    );
  });
});
