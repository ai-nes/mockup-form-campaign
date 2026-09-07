import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getLeadDetail,
  getLeadList,
  LeadApiError,
  normalizeLeadList,
} from "./leads";

afterEach(() => vi.restoreAllMocks());

function listFixture() {
  return {
    data: [
      {
        id: "LEAD-2026-00001",
        leadCode: "LD-2026-00001",
        studentId: "LEAD-2026-00001",
        initials: "MA",
        name: "Nguyễn Minh An",
        phone: "0900000000",
        school: "THPT Châu Văn Liêm",
        status: "Mới",
        statusCode: "NEW",
        source: "Website",
        owner: "Chưa phân công",
      },
    ],
    meta: {
      total: 1,
      totalAll: 8,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      hasNextPage: false,
      admissionYear: 2026,
      query: "Nguyễn",
      status: null,
      statusOptions: [{ value: "NEW", label: "Mới" }],
      asOf: "2026-09-07T10:00:00+07:00",
    },
  };
}

describe("Lead list/detail API contract", () => {
  it("serializes list filters and normalizes the Frappe message envelope", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: listFixture() }), {
        status: 200,
      }),
    );

    const result = await getLeadList(
      {
        admissionYear: 2026,
        page: 1,
        pageSize: 10,
        q: "Nguyễn",
        status: "NEW",
        campaign: "CAM-2026-00001",
      },
      { baseUrl: "http://frappe:8000" },
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.director_leads.get_director_leads?admissionYear=2026&page=1&pageSize=10&q=Nguy%E1%BB%85n&status=NEW&campaign=CAM-2026-00001",
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
    expect(result.data[0]?.name).toBe("Nguyễn Minh An");
    expect(result.data[0]?.leadCode).toBe("LD-2026-00001");
    expect(result.data[0]?.studentId).toBe("LEAD-2026-00001");
    expect(result.meta.statusOptions).toEqual([{ value: "NEW", label: "Mới" }]);
  });

  it("rejects an invalid list envelope with a stable typed error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: { data: "not-an-array" } }), {
        status: 200,
      }),
    );

    await expect(
      getLeadList({}, { baseUrl: "http://frappe:8000" }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<LeadApiError>>({
        status: 502,
        code: "INVALID_LEAD_LIST_RESPONSE",
      }),
    );
  });

  it("maps a missing Lead detail to null", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: { code: "LEAD_NOT_FOUND" } }), {
        status: 404,
      }),
    );

    await expect(
      getLeadDetail("LEAD-MISSING", { baseUrl: "http://frappe:8000" }),
    ).resolves.toBeNull();
  });

  it("calls the detail endpoint and normalizes the Lead projection", async () => {
    const detail = {
      lead: {
        ...listFixture().data[0],
        email: "an@example.com",
        secondaryEmail: "",
        province: "Cần Thơ",
        interestedMajor: "Trí tuệ nhân tạo",
        adChannel: "Facebook Ads",
        segments: ["Quan tâm học bổng"],
        enrollmentYear: 2026,
        conversionPotential: "Cao",
        branch: "Cần Thơ",
        tags: [],
        fptAspiration: "Nguyện vọng 1",
        eventsParticipated: [],
        description: "Lead quan tâm tuyển sinh.",
      },
      log: [],
      meta: {},
    };
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: detail }), { status: 200 }),
    );

    const result = await getLeadDetail("LEAD-2026-00001", {
      baseUrl: "http://frappe:8000",
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.director_leads.get_director_lead?lead_id=LEAD-2026-00001",
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
    expect(result?.lead.email).toBe("an@example.com");
    expect(result?.lead.segments).toEqual(["Quan tâm học bổng"]);
  });

  it("normalizes a valid detail response without changing empty arrays", () => {
    const detail = {
      lead: {
        ...listFixture().data[0],
        email: "an@example.com",
        secondaryEmail: "",
        province: "Cần Thơ",
        interestedMajor: "Trí tuệ nhân tạo",
        adChannel: "Facebook Ads",
        segments: [],
        enrollmentYear: null,
        conversionPotential: null,
        branch: "Cần Thơ",
        tags: [],
        fptAspiration: "",
        eventsParticipated: [],
        description: "",
      },
      log: [],
      meta: {},
    };

    expect(normalizeLeadList({ message: listFixture() }).data).toHaveLength(1);
    expect(detail.log).toEqual([]);
  });
});
