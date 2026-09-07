import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SalesTeamApiError,
  getSalesTeamMemberDetail,
  getSalesTeamWorkspace,
  normalizeSalesTeamWorkspace,
} from "./sales-team";

afterEach(() => vi.restoreAllMocks());

function member(overrides: Record<string, unknown> = {}) {
  return {
    id: "STAFF-1",
    displayName: "Nguyễn Minh Anh",
    email: "minhanh@example.test",
    availability: "active",
    health: "good",
    activeStudents: 4,
    capacity: 10,
    loadRate: 40,
    consultedToday: 2,
    admittedThisMonth: 1,
    overdue: 0,
    conversionRate: 25,
    regions: ["Cần Thơ"],
    specialties: ["Công nghệ thông tin"],
    lastActivityAt: "2026-09-05T09:40:00+07:00",
    supportReason: null,
    ...overrides,
  };
}

function workspaceFixture() {
  return {
    meta: {
      viewer: { id: "lead@example.test", displayName: "Lead Sale" },
      team: { id: "TEAM-1", name: "Đội Sale" },
      admissionYear: 2026,
      date: "2026-09-05",
      asOf: "2026-09-05T09:45:00+07:00",
      timezone: "Asia/Ho_Chi_Minh",
      status: "available",
      warnings: [],
    },
    summary: {
      memberCount: 1,
      activeMemberCount: 1,
      assignedStudents: 4,
      totalCapacity: 10,
      loadRate: 40,
      supportMemberCount: 0,
      overdueStudents: 0,
    },
    attention: { count: 0, items: [] },
    loadSummary: {
      assignedStudents: 4,
      totalCapacity: 10,
      loadRate: 40,
      topMembers: [
        {
          memberId: "STAFF-1",
          displayName: "Nguyễn Minh Anh",
          activeStudents: 4,
          capacity: 10,
          loadRate: 40,
          health: "good",
        },
      ],
    },
    members: [member()],
    pagination: { page: 1, pageSize: 50, total: 1, totalPages: 1, hasNextPage: false },
  };
}

describe("Lead Sale sales-team API contract", () => {
  it("serializes workspace params and unwraps the Frappe message", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: workspaceFixture() }), { status: 200 }),
    );

    const result = await getSalesTeamWorkspace(
      {
        admissionYear: 2026,
        date: "2026-09-05",
        timezone: "Asia/Ho_Chi_Minh",
        availability: "all",
        q: "nguyen",
        page: 2,
        pageSize: 20,
        sort: "name",
      },
      { baseUrl: "http://frappe:8000" },
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.lead_sale.get_sales_team_workspace?admissionYear=2026&date=2026-09-05&timezone=Asia%2FHo_Chi_Minh&availability=all&q=nguyen&page=2&pageSize=20&sort=name&order=asc",
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
    expect(result.summary.assignedStudents).toBe(4);
    expect(result.members[0].displayName).toBe("Nguyễn Minh Anh");
  });

  it("calls member detail with the selected member and snapshot params", async () => {
    const detail = {
      meta: workspaceFixture().meta,
      member: member({ health: "support", overdue: 1, supportReason: "Cần theo dõi" }),
      healthAssessment: {
        status: "support",
        evaluatedAt: "2026-09-05T09:45:00+07:00",
        reasons: [
          {
            code: "OVERDUE_CONTACTS",
            label: "Hồ sơ quá hạn liên hệ",
            value: 1,
            detail: "Có 1 hồ sơ chưa được liên hệ đúng hạn.",
          },
        ],
      },
      metricWindow: {
        admissionYear: 2026,
        today: { from: "2026-09-05T00:00:00+07:00", to: "2026-09-05T23:59:59+07:00" },
        month: { from: "2026-09-01T00:00:00+07:00", to: "2026-09-30T23:59:59+07:00" },
      },
      permissions: { canViewStudents: true },
    };
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: detail }), { status: 200 }),
    );

    const result = await getSalesTeamMemberDetail(
      {
        memberId: "STAFF-1",
        admissionYear: 2026,
        date: "2026-09-05",
        timezone: "Asia/Ho_Chi_Minh",
      },
      { baseUrl: "http://frappe:8000" },
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.lead_sale.get_sales_team_member_detail?memberId=STAFF-1&admissionYear=2026&date=2026-09-05&timezone=Asia%2FHo_Chi_Minh",
      expect.objectContaining({ method: "GET" }),
    );
    expect(result.healthAssessment.reasons[0].code).toBe("OVERDUE_CONTACTS");
  });

  it("rejects malformed payloads and preserves typed HTTP errors", async () => {
    const invalid = workspaceFixture();
    delete (invalid.members[0] as { email?: string }).email;
    expect(() => normalizeSalesTeamWorkspace({ message: invalid })).toThrow();

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: { code: "FORBIDDEN", message: "Not permitted" } }), {
        status: 403,
      }),
    );
    await expect(
      getSalesTeamWorkspace({}, { baseUrl: "http://frappe:8000" }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<SalesTeamApiError>>({
        status: 403,
        code: "FORBIDDEN",
      }),
    );
  });
});
