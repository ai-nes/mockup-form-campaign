import { afterEach, describe, expect, it, vi } from "vitest";

import {
  computeDirectorOverview,
  DirectorOverviewApiError,
  getDirectorOverview,
  normalizeDirectorOverview,
} from "./index";

afterEach(() => vi.restoreAllMocks());

describe("director admission overview API contract", () => {
  it("computes an empty overview with correct structure when offline (no backend configured)", () => {
    const data = computeDirectorOverview({ admissionYear: 2026, scope: "all", trendRange: "30d" });

    expect(data.meta.admissionYear).toBe(2026);
    expect(data.meta.scope).toBe("all");
    expect(data.kpis).toEqual([]);
    expect(data.forecast.summary.actual).toBe(0);
    expect(data.forecast.points).toEqual([]);
    expect(data.briefing.alert.id).toBe("");
    expect(data.pipeline.stages).toEqual([]);
    expect(data.pipeline.biggestDrop.fromStageId).toBe("");
    expect(data.admissionsTrend.ranges["30d"].points).toEqual([]);
    expect(data.marketOverview).toEqual([]);
    expect(data.sourcePerformance).toEqual([]);
    expect(data.weeklyActivity.points).toEqual([]);
  });

  it("converts invalid regional metrics to finite display values", () => {
    const payload = computeDirectorOverview({ admissionYear: 2026 });
    const baseRegion = {
      id: "region-a",
      name: "Region A",
      prospects: "0",
      enrolled: "0",
      conversion: "0%",
      growth: "0%",
      coverage: 0,
      tone: "primary" as const,
    };
    const result = normalizeDirectorOverview({
      ...payload,
      marketOverview: [
        {
          ...baseRegion,
          prospects: "2",
          enrolled: "0",
          conversion: "NaN%",
          growth: "NaN%",
          coverage: Number.NaN,
        },
        {
          ...baseRegion,
          id: "region-b",
          name: "Region B",
          prospects: "NaN",
          enrolled: "NaN",
          conversion: "NaN%",
          growth: "NaN%",
          coverage: Number.NaN,
        },
      ],
    });

    expect(result.marketOverview).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ prospects: "2", enrolled: "0", conversion: "0%", growth: "0%", coverage: 0 }),
        expect.objectContaining({ prospects: "0", enrolled: "0", conversion: "0%", growth: "0%", coverage: 0 }),
      ]),
    );
  });

  it("calls Frappe endpoint with proper query parameters and parses envelope", async () => {
    const mockPayload = computeDirectorOverview({ admissionYear: 2026 });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: mockPayload }), { status: 200 }),
    );

    const result = await getDirectorOverview(
      { admissionYear: 2026, scope: "all", trendRange: "30d" },
      { baseUrl: "http://frappe:8000" },
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.director_dashboard.get_director_overview?admissionYear=2026&scope=all&trendRange=30d",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(result.meta.admissionYear).toBe(2026);
    expect(result.kpis.length).toBe(mockPayload.kpis.length);
  });

  it("handles Frappe error responses correctly", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: "Không có quyền xem phạm vi này.",
          },
        }),
        { status: 403 },
      ),
    );

    await expect(
      getDirectorOverview(
        { admissionYear: 2026, scope: "secret" },
        { baseUrl: "http://frappe:8000" },
      ),
    ).rejects.toEqual(
      expect.objectContaining<Partial<DirectorOverviewApiError>>({
        status: 403,
        code: "FORBIDDEN",
        message: "Không có quyền xem phạm vi này.",
      }),
    );
  });

  it("rejects an invalid response body with 502 INVALID_OVERVIEW_RESPONSE", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: { invalid: true } }), { status: 200 }),
    );

    await expect(
      getDirectorOverview(
        { admissionYear: 2026 },
        { baseUrl: "http://frappe:8000" },
      ),
    ).rejects.toEqual(
      expect.objectContaining<Partial<DirectorOverviewApiError>>({
        status: 502,
        code: "INVALID_OVERVIEW_RESPONSE",
      }),
    );
  });
});
