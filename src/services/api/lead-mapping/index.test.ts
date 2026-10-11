import { afterEach, describe, expect, it, vi } from "vitest";
import { createPublicLead, getPublicCampaigns, getPublicCampuses } from "./index";

afterEach(() => vi.unstubAllGlobals());

describe("public form campus contract", () => {
  it("keeps the campaign campus id and name returned by the server", async () => {
    vi.stubGlobal("fetch", async () => Response.json({ items: [
      { value: "campaign-1", code: "CAM-1", title: "Tuyển sinh", campus_id: "campus-1", campus: "HCM" },
    ] }));
    expect((await getPublicCampaigns())[0]).toMatchObject({ campus_id: "campus-1", campus: "HCM" });
  });

  it("loads campuses through the same-origin public proxy", async () => {
    let path = "";
    vi.stubGlobal("fetch", async (url: string) => {
      path = url;
      return Response.json({ items: [{ value: "campus-1", label: "HCM" }] });
    });
    expect(await getPublicCampuses()).toEqual([{ value: "campus-1", label: "HCM" }]);
    expect(path).toBe("/api/backend/public/campuses");
  });

  it("sends the campaign campus id with the public registration", async () => {
    let body: Record<string, unknown> = {};
    vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
      body = JSON.parse(init.body as string);
      return Response.json({ data: { id: "lead-1", leadCode: "LD-1" } }, { status: 201 });
    });
    await createPublicLead({ student_name: "Nguyen A", campaign_code: "CAM-1", campus_id: "campus-1" });
    expect(body).toMatchObject({ campaignCode: "CAM-1", campusId: "campus-1" });
  });
});
