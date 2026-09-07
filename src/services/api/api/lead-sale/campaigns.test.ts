import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CampaignApiError,
  getCampaignList,
  normalizeCampaignList,
} from "./campaigns";

afterEach(() => vi.restoreAllMocks());

describe("Lead Sale campaign API contract", () => {
  it("loads and normalizes campaigns from the Frappe message envelope", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            total: 1,
            start: 0,
            page_length: 100,
            campaigns: [
              {
                name: "Tuyen sinh mua thu 2026",
                stable_code: "CAM-2026-00001",
                title: "Tuyển sinh mùa thu 2026",
                status: "ACTIVE",
              },
            ],
          },
        }),
        { status: 200 },
      ),
    );

    const result = await getCampaignList(
      {},
      { baseUrl: "http://frappe:8000" },
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.campaign.list_campaigns?start=0&page_length=100",
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
    expect(result).toEqual({
      total: 1,
      campaigns: [
        {
          name: "Tuyen sinh mua thu 2026",
          stableCode: "CAM-2026-00001",
          title: "Tuyển sinh mùa thu 2026",
          status: "ACTIVE",
        },
      ],
    });
  });

  it("serializes the campaign search parameter", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: { total: 0, campaigns: [] } }), {
        status: 200,
      }),
    );

    await getCampaignList(
      {
        search: " Học bổng & 2026 ",
        start: 10,
        pageLength: 25,
        leadOnly: true,
      },
      { baseUrl: "http://frappe:8000" },
    );

    expect(fetch).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.campaign.list_campaigns?start=10&page_length=25&search=H%E1%BB%8Dc+b%E1%BB%95ng+%26+2026&lead_only=1",
      expect.anything(),
    );
  });

  it("loads all campaign pages when the result is larger than one page", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: {
              total: 2,
              campaigns: [
                { name: "Campaign A", title: "Campaign A", status: "ACTIVE" },
              ],
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: {
              total: 2,
              campaigns: [
                { name: "Campaign B", title: "Campaign B", status: "DRAFT" },
              ],
            },
          }),
          { status: 200 },
        ),
      );

    const result = await getCampaignList(
      { pageLength: 1 },
      { baseUrl: "http://frappe:8000" },
    );

    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "http://frappe:8000/api/method/crm.api.campaign.list_campaigns?start=1&page_length=1",
      expect.anything(),
    );
    expect(result.campaigns.map((campaign) => campaign.name)).toEqual([
      "Campaign A",
      "Campaign B",
    ]);
  });

  it("rejects an invalid campaign list envelope", async () => {
    await expect(
      Promise.resolve().then(() => normalizeCampaignList({ message: {} })),
    ).rejects.toThrow("Invalid Campaign list response");
  });

  it("exposes the upstream error code", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: "FORBIDDEN", message: "Không có quyền." },
        }),
        { status: 403 },
      ),
    );

    await expect(
      getCampaignList({}, { baseUrl: "http://frappe:8000" }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<CampaignApiError>>({
        status: 403,
        code: "FORBIDDEN",
      }),
    );
  });
});
