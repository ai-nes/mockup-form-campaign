import { afterEach, describe, expect, it, vi } from "vitest";

import { getIntegrations, IntegrationsApiError } from "./index";

afterEach(() => vi.restoreAllMocks());

describe("integrations API contract", () => {
  it("loads all supported integration types", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            data: [
              {
                type: "call",
                provider: "twilio",
                label: "Twilio",
                enabled: true,
                status: "enabled",
              },
              {
                type: "call",
                provider: "exotel",
                label: "Exotel",
                enabled: false,
                status: "disabled",
              },
              {
                type: "zalo",
                provider: "zalo_oa",
                label: "Zalo OA",
                enabled: false,
                status: "not_configured",
              },
            ],
            meta: {
              requested_type: null,
              returned_types: ["call", "zalo"],
              total: 3,
            },
          },
        }),
        { status: 200 },
      ),
    );

    const result = await getIntegrations({}, { baseUrl: "http://frappe:8000" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.integrations.api.get_integrations",
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
    expect(result.meta.returnedTypes).toEqual(["call", "zalo"]);
    expect(result.data[2]).toMatchObject({
      type: "zalo",
      status: "not_configured",
    });
  });

  it("passes the type filter and normalizes the response", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            data: [
              {
                type: "call",
                provider: "twilio",
                label: "Twilio",
                enabled: true,
                status: "enabled",
              },
              {
                type: "call",
                provider: "exotel",
                label: "Exotel",
                enabled: false,
                status: "disabled",
              },
            ],
            meta: {
              requested_type: "call",
              returned_types: ["call"],
              total: 2,
            },
          },
        }),
        { status: 200 },
      ),
    );

    const result = await getIntegrations(
      { type: "call" },
      { baseUrl: "http://frappe:8000" },
    );

    expect(fetchSpy.mock.calls[0]?.[0]).toBe(
      "http://frappe:8000/api/method/crm.integrations.api.get_integrations?type=call",
    );
    expect(result.meta.requestedType).toBe("call");
    expect(result.data).toHaveLength(2);
  });

  it("maps backend validation errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          exc_type: "ValidationError",
          message: "Unsupported integration type: email. Use 'call' or 'zalo'.",
        }),
        { status: 417 },
      ),
    );

    await expect(
      getIntegrations({ type: "call" }, { baseUrl: "http://frappe:8000" }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<IntegrationsApiError>>({
        status: 417,
        code: "INVALID_INTEGRATION_TYPE",
      }),
    );
  });

  it("rejects an invalid response envelope", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: { data: [] } }), { status: 200 }),
    );

    await expect(
      getIntegrations({}, { baseUrl: "http://frappe:8000" }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<IntegrationsApiError>>({
        status: 502,
        code: "INVALID_INTEGRATIONS_RESPONSE",
      }),
    );
  });
});
