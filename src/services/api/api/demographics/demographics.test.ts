import { afterEach, describe, expect, it, vi } from "vitest";

import {
  computeDirectorDemographicsOverview,
  computeDirectorDemographicsSegment,
  DirectorDemographicsApiError,
  getDirectorDemographicsOverview,
  getDirectorDemographicsSegment,
} from "./index";

afterEach(() => vi.restoreAllMocks());

describe("director demographics API contract", () => {
  it("computes an empty overview with valid structure when offline (no backend configured)", async () => {
    const data = await getDirectorDemographicsOverview({ admissionYear: 2026, period: "6m", scope: "all" });

    expect(data.meta.admissionYear).toBe(2026);
    expect(data.data.kpis).toEqual([]);
    expect(data.data.segments).toEqual([]);
    expect(data.data.acquisitionMap.formFunnel).toEqual([]);
    expect(data.data.acquisitionMap.attributionModel.firstTouch).toBe("first-touch");
    expect(typeof data.data.acquisitionMap.submissionTiming.timezone).toBe("string");
    expect(data.meta.page).toBe(1);
    expect(data.meta.pageSize).toBe(5);
    expect(data.meta.total).toBe(0);
  });

  it("returns empty pages when offline (no segments to paginate)", async () => {
    const firstPage = await getDirectorDemographicsOverview({ page: 1, pageSize: 2 });
    const secondPage = await getDirectorDemographicsOverview({ page: 2, pageSize: 2 });

    expect(firstPage.data.segments).toHaveLength(0);
    expect(secondPage.data.segments).toHaveLength(0);
    expect(firstPage.meta.total).toBe(secondPage.meta.total);
    expect(firstPage.meta.total).toBe(0);
    expect(firstPage.meta.totalPages).toBe(1);
    expect(firstPage.meta.hasNextPage).toBe(false);
    expect(secondPage.meta.page).toBe(2);
  });

  it("calls Frappe overview endpoint with parameters and validates envelope", async () => {
    const mockOverview = computeDirectorDemographicsOverview({ admissionYear: 2026 });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: mockOverview }), { status: 200 }),
    );

    const result = await getDirectorDemographicsOverview(
      { admissionYear: 2026, period: "6m", scope: "all" },
      { baseUrl: "http://frappe:8000" },
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.director_demographics.get_director_demographics_overview?admissionYear=2026&period=6m&scope=all",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(result.data.kpis.length).toBe(mockOverview.data.kpis.length);
    expect(result.meta.admissionYear).toBe(2026);
  });

  it("rejects an overview response without pagination metadata", async () => {
    const mockOverview = computeDirectorDemographicsOverview({ admissionYear: 2026 });
    const meta = Object.fromEntries(
      Object.entries(mockOverview.meta).filter(([key]) => !["page", "pageSize", "total", "totalPages", "hasNextPage"].includes(key)),
    );
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: { data: mockOverview.data, meta } }), { status: 200 }),
    );

    await expect(
      getDirectorDemographicsOverview({ admissionYear: 2026 }, { baseUrl: "http://frappe:8000" }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<DirectorDemographicsApiError>>({
        status: 502,
        code: "INVALID_DEMOGRAPHICS_RESPONSE",
      }),
    );
  });

  it("passes overview pagination parameters to Frappe", async () => {
    // Use a valid envelope (page 1) as the mocked response; the assertion below
    // checks that the *request* URL still carries the page=2 params from `params`.
    const mockOverview = computeDirectorDemographicsOverview({ page: 1, pageSize: 2 });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: mockOverview }), { status: 200 }),
    );

    await getDirectorDemographicsOverview(
      { admissionYear: 2026, page: 2, pageSize: 2, period: "6m", scope: "all" },
      { baseUrl: "http://frappe:8000" },
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.director_demographics.get_director_demographics_overview?admissionYear=2026&page=2&pageSize=2&period=6m&scope=all",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("throws DirectorDemographicsApiError on authorization failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ error: { code: "FORBIDDEN", message: "Không có quyền truy cập." } }),
        { status: 403 },
      ),
    );

    await expect(
      getDirectorDemographicsOverview({ admissionYear: 2026 }, { baseUrl: "http://frappe:8000" }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<DirectorDemographicsApiError>>({
        status: 403,
        code: "FORBIDDEN",
      }),
    );
  });

  it("rejects invalid overview envelope with 502", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: { data: { kpis: "invalid" } } }), { status: 200 }),
    );

    await expect(
      getDirectorDemographicsOverview({ admissionYear: 2026 }, { baseUrl: "http://frappe:8000" }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<DirectorDemographicsApiError>>({
        status: 502,
        code: "INVALID_DEMOGRAPHICS_RESPONSE",
      }),
    );
  });

  it("calls Frappe segment endpoint and maps 404 to null", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ error: { code: "SEGMENT_NOT_FOUND", message: "Không tìm thấy phân khúc." } }),
        { status: 404 },
      ),
    );

    const result = await getDirectorDemographicsSegment(
      { segment_id: "non-existent", admissionYear: 2026 },
      { baseUrl: "http://frappe:8000" },
    );

    expect(result).toBeNull();
  });

  it("returns null when computing a segment that does not exist offline", () => {
    const result = computeDirectorDemographicsSegment({ segment_id: "any-segment" });
    expect(result).toBeNull();
  });

  it("calls Frappe segment endpoint successfully with valid payload", async () => {
    const fixtureSegment = {
      id: "test-segment",
      name: "Test",
      shortName: "Test",
      description: "",
      region: "",
      interest: "",
      prospects: 0,
      engaged: 0,
      qualified: 0,
      counselling: 0,
      applications: 0,
      enrolled: 0,
      conversion: 0,
      tuition: null,
      revenue: null,
      growth: 0,
      coverage: 0,
      opportunityScore: 0,
      tone: "primary" as const,
      filters: [],
      channels: [],
      monthlyProspects: [],
    };
    const mockSegment = {
      data: {
        segment: fixtureSegment,
        benchmark: fixtureSegment,
        regionOpportunities: [],
        nextAction: {
          priority: "normal" as const,
          label: "",
          title: "",
          description: "",
          steps: [],
        },
        guardrails: [],
      },
      meta: {
        admissionYear: 2026,
        asOf: "",
        minSampleSize: 30,
        sampleSize: 0,
      },
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: mockSegment }), { status: 200 }),
    );

    const result = await getDirectorDemographicsSegment(
      { segment_id: "test-segment", admissionYear: 2026 },
      { baseUrl: "http://frappe:8000" },
    );

    expect(result).not.toBeNull();
    expect(result?.data.segment.id).toBe("test-segment");
  });

  it("rejects invalid segment envelope with 502", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: { data: { segment: null } } }), { status: 200 }),
    );

    await expect(
      getDirectorDemographicsSegment(
        { segment_id: "female-ai-dong-nai", admissionYear: 2026 },
        { baseUrl: "http://frappe:8000" },
      ),
    ).rejects.toEqual(
      expect.objectContaining<Partial<DirectorDemographicsApiError>>({
        status: 502,
        code: "INVALID_SEGMENT_RESPONSE",
      }),
    );
  });
});
