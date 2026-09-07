import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
} from "./index";

describe("CRM Tasks API Service", () => {
  const originalFetch = globalThis.fetch;
  const baseUrl = "http://crm-test.local:8000";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("list task theo hồ sơ bằng GET và chuẩn hóa field snake_case", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        message: {
          total: 1,
          start: 0,
          page_length: 20,
          tasks: [
            {
              name: "1",
              title: "Gọi lại tư vấn viên",
              description: "Xác nhận lịch tư vấn.",
              action_code: "CALL_BACK",
              assigned_to: "sale@example.com",
              status: "Todo",
              priority: "High",
              due_date: "2026-09-05 17:00:00",
              reference_doctype: "CRM Lead",
              reference_docname: "ENR-2026-00005",
            },
          ],
        },
      }),
    });

    const result = await listTasks(
      {
        referenceDoctype: "CRM Lead",
        referenceDocname: "ENR-2026-00005",
        status: "Todo",
      },
      { baseUrl },
    );

    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${baseUrl}/api/method/crm.api.task.list_tasks?reference_doctype=CRM+Lead&reference_docname=ENR-2026-00005&status=Todo&start=0&page_length=20`,
      expect.objectContaining({ method: "GET" }),
    );
    expect(result.tasks[0]).toMatchObject({
      name: "1",
      assignedTo: "sale@example.com",
      status: "Todo",
      priority: "High",
      dueDate: "2026-09-05 17:00:00",
      actionCode: "CALL_BACK",
    });
  });

  it("list task theo scope session khi không truyền hồ sơ", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        message: {
          total: 0,
          start: 0,
          page_length: 100,
          tasks: [],
        },
      }),
    });

    const result = await listTasks({ start: 0, pageLength: 100 }, { baseUrl });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${baseUrl}/api/method/crm.api.task.list_tasks?start=0&page_length=100`,
      expect.objectContaining({ method: "GET" }),
    );
    expect(result.total).toBe(0);
  });

  it("get task theo name", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        message: {
          name: "1",
          title: "Gọi lại tư vấn viên",
          reference_doctype: "CRM Lead",
          reference_docname: "ENR-2026-00005",
        },
      }),
    });

    const result = await getTask("1", { baseUrl });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${baseUrl}/api/method/crm.api.task.get_task?name=1`,
      expect.objectContaining({ method: "GET" }),
    );
    expect(result.name).toBe("1");
  });

  it("create task bằng POST với payload snake_case", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        message: {
          name: "2",
          title: "Gọi lại tư vấn viên",
          reference_doctype: "CRM Lead",
          reference_docname: "ENR-2026-00005",
        },
      }),
    });

    await createTask(
      {
        referenceDoctype: "CRM Lead",
        referenceDocname: "ENR-2026-00005",
        title: "Gọi lại tư vấn viên",
        description: "Xác nhận lịch tư vấn.",
        actionCode: "CALL_BACK",
        priority: "High",
        status: "Todo",
        dueDate: "2026-09-05 17:00:00",
      },
      { baseUrl },
    );

    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${baseUrl}/api/method/crm.api.task.create_task`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          reference_doctype: "CRM Lead",
          reference_docname: "ENR-2026-00005",
          title: "Gọi lại tư vấn viên",
          description: "Xác nhận lịch tư vấn.",
          action_code: "CALL_BACK",
          priority: "High",
          status: "Todo",
          due_date: "2026-09-05 17:00:00",
        }),
      }),
    );
  });

  it("update task bằng PUT", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        message: {
          name: "2",
          title: "Gọi lại lần 2",
          status: "In Progress",
          reference_doctype: "CRM Lead",
          reference_docname: "ENR-2026-00005",
        },
      }),
    });

    const result = await updateTask(
      { name: "2", title: "Gọi lại lần 2", status: "In Progress" },
      { baseUrl },
    );

    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${baseUrl}/api/method/crm.api.task.update_task`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          name: "2",
          title: "Gọi lại lần 2",
          status: "In Progress",
        }),
      }),
    );
    expect(result.status).toBe("In Progress");
  });

  it("delete task bằng DELETE và truyền name qua query string", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: { deleted: "2" } }),
    });

    const result = await deleteTask("2", { baseUrl });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${baseUrl}/api/method/crm.api.task.delete_task?name=2`,
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(result.deleted).toBe("2");
  });
});
