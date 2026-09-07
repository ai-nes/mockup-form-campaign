import { describe, expect, it, vi } from "vitest";

import {
  createNbaAction,
  deleteNbaAction,
  getNbaAction,
  updateNbaAction,
} from "./index";
import {
  normalizeNbaActionTypesResponse,
  normalizeNbaActionsResponse,
  normalizeNbaTimeSlotsResponse,
} from "./normalizers";

describe("NBA action API normalizers", () => {
  it("normalizes the Frappe action list and JSON time slots", () => {
    expect(
      normalizeNbaActionsResponse({
        message: {
          total: 1,
          start: 0,
          page_length: 20,
          actions: [
            {
              name: "CALL",
              display_name: "Gọi điện",
              action_type: "CONTACT",
              purpose: "Liên hệ với học sinh.",
              default_channel: "CALL",
              allowed_actors: ["Sale", "Lead Sale"],
              requires_approval: 0,
              auto_execute: 0,
              execution_type: "MANUAL",
              ai_allowed: 0,
              sort_order: 10,
              modified: "2026-09-04 08:00:00",
              allowed_time_slots: '["6-12", "18-24"]',
              enabled: 1,
            },
          ],
        },
      }),
    ).toEqual({
      total: 1,
      start: 0,
      pageLength: 20,
      actions: [
        {
          name: "CALL",
          code: "CALL",
          displayName: "Gọi điện",
          actionType: "CONTACT",
          description: null,
          purpose: "Liên hệ với học sinh.",
          defaultChannel: "CALL",
          allowedActors: ["Sale", "Lead Sale"],
          allowedTimeSlots: ["6-12", "18-24"],
          requiresApproval: false,
          autoExecute: false,
          executionType: "MANUAL",
          aiAllowed: false,
          enabled: true,
          sortOrder: 10,
          modified: "2026-09-04 08:00:00",
        },
      ],
    });
  });

  it("normalizes action types and the server-defined time slot list", () => {
    expect(
      normalizeNbaActionTypesResponse({
        message: {
          total: 1,
          action_types: [
            {
              name: "CONTACT",
              display_name: "Liên hệ",
              enabled: true,
            },
          ],
        },
      }),
    ).toMatchObject({
      total: 1,
      actionTypes: [
        {
          name: "CONTACT",
          actionType: "CONTACT",
          displayName: "Liên hệ",
          enabled: true,
        },
      ],
    });

    expect(
      normalizeNbaTimeSlotsResponse({
        message: { time_slots: ["0-6", "6-12", "invalid"] },
      }),
    ).toEqual({ timeSlots: ["0-6", "6-12"] });
  });

  it("sends allowed time slots as an array to Frappe", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            name: "CALL",
            action: {
              name: "CALL",
              code: "CALL",
              display_name: "Gọi điện",
              allowed_time_slots: '["6-12", "12-18"]',
              enabled: 1,
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    try {
      await updateNbaAction(
        { name: "CALL", allowedTimeSlots: ["6-12", "12-18"] },
        { baseUrl: "http://frappe:8000" },
      );
    } finally {
      vi.unstubAllGlobals();
    }

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://frappe:8000/api/method/crm.api.action.update_action?name=CALL",
    );
    expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({ method: "PUT" }));
    expect(requestBody).toEqual({
      allowed_time_slots: ["6-12", "12-18"],
    });
  });

  it("calls create, get and delete Action with the documented methods", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: { name: "SEND_EMAIL", code: "SEND_EMAIL", display_name: "Gửi Email", action_type: "CONTACT", default_channel: "EMAIL", allowed_actors: ["Sale"], allowed_time_slots: [], enabled: 1 } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: { name: "SEND_EMAIL", code: "SEND_EMAIL", display_name: "Gửi Email", action_type: "CONTACT", default_channel: "EMAIL", allowed_actors: ["Sale"], allowed_time_slots: [], enabled: 1 } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: { deleted: "SEND_EMAIL" } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    try {
      await createNbaAction({ code: "SEND_EMAIL", displayName: "Gửi Email", actionType: "CONTACT", defaultChannel: "EMAIL", allowedActors: ["Sale"], allowedTimeSlots: [], requiresApproval: false, autoExecute: false, executionType: "MANUAL", aiAllowed: false, enabled: true, sortOrder: 20 }, { baseUrl: "http://frappe:8000" });
      await getNbaAction("SEND_EMAIL", { baseUrl: "http://frappe:8000" });
      await deleteNbaAction("SEND_EMAIL", { baseUrl: "http://frappe:8000" });
    } finally {
      vi.unstubAllGlobals();
    }

    expect(fetchMock.mock.calls[0][0]).toBe("http://frappe:8000/api/method/crm.api.action.create_action");
    expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({ method: "POST" }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toMatchObject({ code: "SEND_EMAIL", allowed_actors: ["Sale"], allowed_time_slots: [] });
    expect(fetchMock.mock.calls[1][0]).toBe("http://frappe:8000/api/method/crm.api.action.get_action?name=SEND_EMAIL");
    expect(fetchMock.mock.calls[2][0]).toBe("http://frappe:8000/api/method/crm.api.action.delete_action?name=SEND_EMAIL");
    expect(fetchMock.mock.calls[2][1]).toEqual(expect.objectContaining({ method: "DELETE" }));
  });
});
