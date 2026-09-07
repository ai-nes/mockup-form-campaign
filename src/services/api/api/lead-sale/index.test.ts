import { afterEach, describe, expect, it, vi } from "vitest";

import {
  LeadSaleOverviewApiError,
  getLeadSaleOverview,
  normalizeLeadSaleOverview,
} from "./index";

afterEach(() => vi.restoreAllMocks());

function overviewFixture() {
  return {
    meta: {
      viewer: { id: "lead@example.com", displayName: "Lead Sale" },
      team: { id: "TEAM-1", name: "Đội Sale" },
      admissionYear: 2026,
      date: "2026-09-05",
      asOf: "2026-09-05T09:15:00+07:00",
      timezone: "Asia/Ho_Chi_Minh",
      status: "available",
      warnings: [],
    },
    kpis: [
      { id: "active", value: 2 },
      { id: "new", value: 1 },
      { id: "unassigned", value: 1 },
      { id: "needs-action", value: 1 },
      { id: "overdue", value: 0 },
      { id: "documents", value: 0 },
    ],
    interventions: {
      items: [
        { id: "unassigned", count: 1 },
        { id: "not-contacted", count: 0 },
        { id: "at-risk", count: 0 },
        { id: "blocked", count: 0 },
      ],
    },
    teamPerformance: {
      items: [
        {
          id: "STAFF-1",
          displayName: "Nguyễn Minh Anh",
          activeStudents: 2,
          consulted: 1,
          admitted: 0,
          status: "needs-support",
        },
      ],
    },
    studentStatus: {
      total: 2,
      items: [
        { id: "consulting", label: "Đang tư vấn", count: 1, share: 50 },
        { id: "waiting", label: "Chờ phản hồi", count: 1, share: 50 },
        { id: "documents", label: "Đang làm hồ sơ", count: 0, share: 0 },
        { id: "admission", label: "Chờ nhập học", count: 0, share: 0 },
        { id: "new", label: "Mới nhận", count: 0, share: 0 },
      ],
    },
    resultTrend: {
      defaultRange: "4w",
      ranges: {
        "4w": { from: "2026-08-10", to: "2026-09-05", points: [] },
        "3m": { from: "2026-06-05", to: "2026-09-05", points: [] },
      },
    },
  };
}

describe("Lead Sale overview API contract", () => {
  it("serializes the query, unwraps message, and normalizes the snapshot", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: overviewFixture() }), {
        status: 200,
      }),
    );

    const result = await getLeadSaleOverview(
      { admissionYear: 2026, date: "2026-09-05", timezone: "Asia/Ho_Chi_Minh" },
      { baseUrl: "http://frappe:8000" },
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.lead_sale.get_lead_sale_overview?admissionYear=2026&date=2026-09-05&trendRange=4w&timezone=Asia%2FHo_Chi_Minh&teamMemberLimit=20",
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
    expect(result.meta.team.name).toBe("Đội Sale");
    expect(result.kpis).toHaveLength(6);
    expect(result.resultTrend.ranges["3m"]).toBeDefined();
  });

  it("maps authorization failures to a stable typed error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: "FORBIDDEN", message: "Not permitted" },
        }),
        {
          status: 403,
        },
      ),
    );

    await expect(
      getLeadSaleOverview({}, { baseUrl: "http://frappe:8000" }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<LeadSaleOverviewApiError>>({
        status: 403,
        code: "FORBIDDEN",
      }),
    );
  });

  it("rejects a response that breaks the status-to-active invariant", () => {
    const fixture = overviewFixture();
    fixture.studentStatus.total = 1;
    expect(() => normalizeLeadSaleOverview({ message: fixture })).toThrow(
      "Incomplete Lead Sale overview response",
    );
  });
});
