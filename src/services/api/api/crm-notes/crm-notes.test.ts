import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createNote,
  CrmNoteApiError,
  deleteNote,
  getNote,
  listNotes,
  updateNote,
} from "./index";

describe("CRM Notes API Service", () => {
  const originalFetch = globalThis.fetch;
  const baseUrl = "http://crm-test.local:8000";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("listNotes", () => {
    it("gọi crm.api.note.list_notes với tham số chuẩn xác và trả về danh sách đã chuẩn hóa", async () => {
      const mockNotes = [
        {
          name: "NOTE-001",
          content: "<p>Đã trao đổi về học bổng 30%</p>",
          reference_doctype: "CRM Lead",
          reference_docname: "STU-0001",
          modified: "2026-09-04 10:00:00",
          creation: "2026-09-04 09:30:00",
          owner: "tu-van-vien@fpt.edu.vn",
          owner_full_name: "Trần Quốc Bảo",
        },
      ];

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          message: {
            total: 1,
            start: 0,
            page_length: 20,
            notes: mockNotes,
          },
        }),
      });

      const result = await listNotes(
        {
          referenceDoctype: "CRM Lead",
          referenceDocname: "STU-0001",
          search: "học bổng",
        },
        { baseUrl },
      );

      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${baseUrl}/api/method/crm.api.note.list_notes?reference_doctype=CRM+Lead&reference_docname=STU-0001&start=0&page_length=20&search=h%E1%BB%8Dc+b%E1%BB%95ng`,
        expect.objectContaining({
          method: "GET",
        }),
      );

      expect(result.total).toBe(1);
      expect(result.notes[0].name).toBe("NOTE-001");
      expect(result.notes[0].ownerFullName).toBe("Trần Quốc Bảo");
      expect(result.notes[0].referenceDoctype).toBe("CRM Lead");
    });
  });

  describe("createNote", () => {
    it("gọi crm.api.note.create_note và trả về ghi chú mới được tạo", async () => {
      const createdNote = {
        name: "NOTE-002",
        content: "<p>Phụ huynh đồng ý nộp hồ sơ</p>",
        reference_doctype: "CRM Lead",
        reference_docname: "STU-0001",
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          message: createdNote,
        }),
      });

      const result = await createNote(
        {
          referenceDoctype: "CRM Lead",
          referenceDocname: "STU-0001",
          content: "<p>Phụ huynh đồng ý nộp hồ sơ</p>",
        },
        { baseUrl },
      );

      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${baseUrl}/api/method/crm.api.note.create_note`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            reference_doctype: "CRM Lead",
            reference_docname: "STU-0001",
            content: "<p>Phụ huynh đồng ý nộp hồ sơ</p>",
          }),
        }),
      );

      expect(result.name).toBe("NOTE-002");
    });
  });

  describe("updateNote", () => {
    it("gọi crm.api.note.update_note để cập nhật content", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          message: {
            name: "NOTE-002",
            content: "<p>Đã nộp hồ sơ</p>",
            reference_doctype: "CRM Lead",
            reference_docname: "STU-0001",
          },
        }),
      });

      const result = await updateNote(
        {
          name: "NOTE-002",
          content: "<p>Đã nộp hồ sơ</p>",
        },
        { baseUrl },
      );

      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${baseUrl}/api/method/crm.api.note.update_note`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            name: "NOTE-002",
            content: "<p>Đã nộp hồ sơ</p>",
          }),
        }),
      );

      expect(result.content).toBe("<p>Đã nộp hồ sơ</p>");
    });
  });

  describe("deleteNote", () => {
    it("gọi crm.api.note.delete_note thành công", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          message: "ok",
        }),
      });

      const result = await deleteNote("NOTE-002", { baseUrl });
      expect(result.success).toBe(true);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${baseUrl}/api/method/crm.api.note.delete_note`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "NOTE-002" }),
        }),
      );
    });
  });

  describe("getNote", () => {
    it("lấy chi tiết ghi chú theo name", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          message: {
            name: "NOTE-001",
            content: "Nội dung",
            reference_doctype: "CRM Lead",
            reference_docname: "STU-0001",
          },
        }),
      });

      const result = await getNote("NOTE-001", { baseUrl });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${baseUrl}/api/method/crm.api.note.get_note?name=NOTE-001`,
        expect.objectContaining({ method: "GET" }),
      );
      expect(result.name).toBe("NOTE-001");
      expect(result.content).toBe("Nội dung");
    });
  });

  describe("error handling", () => {
    it("ném lỗi CrmNoteApiError khi server trả về mã lỗi 403 hoặc thông điệp lỗi", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({
          error: {
            code: "PERMISSION_DENIED",
            message: "Không có quyền sửa ghi chú này.",
          },
        }),
      });

      await expect(
        updateNote({ name: "NOTE-001", content: "Test" }, { baseUrl }),
      ).rejects.toThrow(CrmNoteApiError);
    });

    it("ném lỗi CrmNoteApiError khi không thể kết nối mạng (fetch fail)", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network Error"));

      await expect(
        listNotes(
          { referenceDoctype: "CRM Lead", referenceDocname: "STU-0001" },
          { baseUrl },
        ),
      ).rejects.toThrow(CrmNoteApiError);
    });
  });
});
