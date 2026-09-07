import { afterEach, describe, expect, it, vi } from "vitest";

import {
  averageAvailable,
  normalizeMarketOverview,
  sortByAvailableScore,
} from "./normalizers";
import { DirectorMarketApiError, getDirectorMarketIntelligence } from "./index";

afterEach(() => vi.restoreAllMocks());

describe("market intelligence normalization", () => {
  it("preserves a real zero and keeps missing scalars unavailable", () => {
    const result = normalizeMarketOverview({
      provinces: [
        { code: "01", name: "Hà Nội", schoolCount: 4, opportunity: 0, leads: 0 },
        { code: "02", name: "Cao Bằng" },
      ],
      dataAvailability: { sections: { provinces: "partial" } },
    });

    expect(result.provinces[0].opportunity).toBe(0);
    expect(result.provinces[0].leads).toBe(0);
    expect(result.provinces[0].schoolCount).toBe(4);
    expect(result.provinces[1].opportunity).toBeNull();
    expect(result.provinces[1].highSchools).toEqual([]);
  });

  it("normalizes school coordinates from the market response", () => {
    const result = normalizeMarketOverview({
      provinces: [{
        code: "01",
        name: "Hà Nội",
        highSchools: [{
          id: "school-1",
          name: "THPT Nguyễn Trãi",
          coordinates: { latitude: 21.03, longitude: 105.81 },
        }],
      }],
    });

    expect(result.provinces[0].highSchools[0].coordinates).toEqual({
      latitude: 21.03,
      longitude: 105.81,
    });
  });

  it("sorts unavailable scores after all available scores", () => {
    const rows = [
      { potentialScore: null },
      { potentialScore: 0 },
      { potentialScore: 90 },
    ];

    expect(sortByAvailableScore(rows, "potentialScore").map((row) => row.potentialScore)).toEqual([
      90,
      0,
      null,
    ]);
  });

  it("excludes unavailable values from averages and handles empty input", () => {
    expect(averageAvailable([null, 0, 20])).toBe(10);
    expect(averageAvailable([null, null])).toBeNull();
    expect(normalizeMarketOverview({}).provinces).toEqual([]);
  });

  it("serializes the Frappe request and unwraps its message envelope", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: { status: "available", data: { provinces: [] } } }), { status: 200 }),
    );

    await expect(getDirectorMarketIntelligence(
      { admissionYear: 2026, period: "30d", region: "all", includeSchools: true, schoolLimit: 5 },
      { baseUrl: "http://frappe:8000" },
    )).resolves.toEqual(expect.objectContaining({ provinces: [] }));
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.director_market_intelligence.get_director_market_intelligence_overview?admissionYear=2026&period=30d&region=all&includeSchools=true&schoolLimit=5",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("maps structured API failures without exposing exception payloads", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: { code: "FORBIDDEN", message: "Không có quyền." }, exception: "private" }), { status: 403 }),
    );
    await expect(
      getDirectorMarketIntelligence({}, { baseUrl: "http://frappe:8000" }),
    ).rejects.toEqual(expect.objectContaining<Partial<DirectorMarketApiError>>({ status: 403, code: "FORBIDDEN" }));
  });

  it("rejects a successful response with an invalid envelope", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

    await expect(getDirectorMarketIntelligence({}, { baseUrl: "http://frappe:8000" })).rejects.toEqual(
      expect.objectContaining<Partial<DirectorMarketApiError>>({
        status: 502,
        code: "INVALID_MARKET_RESPONSE",
      }),
    );
  });

  it("keeps the admission year returned by the API", () => {
    expect(normalizeMarketOverview({ meta: { admissionYear: 2027 }, data: { provinces: [] } }).admissionYear).toBe(2027);
  });
});
