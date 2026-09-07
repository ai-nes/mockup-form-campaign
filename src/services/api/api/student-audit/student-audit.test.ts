import { afterEach, describe, expect, it, vi } from "vitest";

import { getStudentAuditLogs, StudentAuditApiError } from "./index";

afterEach(() => vi.restoreAllMocks());

describe("student audit API contract", () => {
  it("calls the read-only Frappe audit endpoint and normalizes its envelope", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            student: "ENR-2026-00001",
            logs: [
              {
                event_id: "abc123:0",
                action: "updated",
                change_type: "changed",
                doctype: "CRM Lead",
                docname: "ENR-2026-00001",
                fieldname: "student_name",
                field_label: "Student Name",
                old_value: "Nguyen Van A",
                new_value: "Nguyen Van An",
                owner: "sale@example.com",
                owner_full_name: "Nguyễn Văn Sale",
                occurred_at: "2026-09-04 10:30:00.000000",
                source: "Version",
                source_name: "abc123",
              },
            ],
            total: 1,
            start: 0,
            page_length: 20,
            read_only: true,
          },
        }),
        { status: 200 },
      ),
    );

    const result = await getStudentAuditLogs(
      { student: "ENR-2026-00001", pageLength: 20 },
      { baseUrl: "http://frappe:8000" },
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.audit.get_student_audit_logs?student=ENR-2026-00001&start=0&page_length=20",
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
    expect(result).toMatchObject({
      student: "ENR-2026-00001",
      total: 1,
      readOnly: true,
    });
    expect(result.logs[0]).toMatchObject({
      eventId: "abc123:0",
      fieldLabel: "Student Name",
      ownerFullName: "Nguyễn Văn Sale",
      occurredAt: "2026-09-04 10:30:00.000000",
      oldValue: "Nguyen Van A",
      newValue: "Nguyen Van An",
    });
  });

  it("maps Frappe authorization and not-found responses to stable errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Not permitted" }), {
        status: 403,
      }),
    );

    await expect(
      getStudentAuditLogs(
        { student: "ENR-2026-00001" },
        { baseUrl: "http://frappe:8000" },
      ),
    ).rejects.toEqual(
      expect.objectContaining<Partial<StudentAuditApiError>>({
        status: 403,
        code: "FORBIDDEN",
      }),
    );
  });

  it("rejects an invalid audit response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: { logs: [] } }), { status: 200 }),
    );

    await expect(
      getStudentAuditLogs(
        { student: "ENR-2026-00001" },
        { baseUrl: "http://frappe:8000" },
      ),
    ).rejects.toEqual(
      expect.objectContaining<Partial<StudentAuditApiError>>({
        status: 502,
        code: "INVALID_AUDIT_RESPONSE",
      }),
    );
  });
});
