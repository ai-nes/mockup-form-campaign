import { afterEach, describe, expect, it, vi } from "vitest";

import {
  computeDirectorStudents,
  computeStudent360,
  DirectorStudentsApiError,
  getDirectorStudents,
  getStudentChatwootInteractions,
  getStudent360,
  getStudentInteractions,
} from "./index";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("director students API contract", () => {
  it("does not display fixture data when the API is unavailable", async () => {
    await expect(
      getDirectorStudents({ admissionYear: 2026, page: 1, pageSize: 20 }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<DirectorStudentsApiError>>({
        status: 503,
        code: "STUDENTS_API_UNAVAILABLE",
      }),
    );
  });

  it("does not fall back to fixture data for a session-scoped list", async () => {
    vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "");

    await expect(
      getDirectorStudents({ admissionYear: 2026 }, { sessionRequired: true }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<DirectorStudentsApiError>>({
        status: 503,
        code: "STUDENTS_SESSION_API_UNAVAILABLE",
      }),
    );
  });

  it("sends browser credentials for a session-scoped list", async () => {
    vi.stubGlobal("window", {});
    vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "http://frappe:8000");
    const mockData = computeDirectorStudents({ admissionYear: 2026 });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: mockData }), { status: 200 }),
    );

    await getDirectorStudents({ admissionYear: 2026 }, { sessionRequired: true });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.director_students.get_director_students?admissionYear=2026",
      expect.objectContaining({ credentials: "include", cache: "no-store" }),
    );
  });

  it("calls Frappe students endpoint with query parameters and parses envelope", async () => {
    const mockData = computeDirectorStudents({ admissionYear: 2026 });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: mockData }), { status: 200 }),
    );

    const result = await getDirectorStudents(
      { admissionYear: 2026, page: 1, pageSize: 10, q: "nguyen", stage: "Tư vấn" },
      { baseUrl: "http://frappe:8000" },
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.director_students.get_director_students?admissionYear=2026&page=1&pageSize=10&q=nguyen&stage=T%C6%B0+v%E1%BA%A5n",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(result.data.length).toBe(mockData.data.length);
    expect(result.meta.total).toBe(mockData.meta.total);
  });

  it("passes an owner filter to the session-scoped students endpoint", async () => {
    const mockData = computeDirectorStudents({ admissionYear: 2026, page: 1, pageSize: 10 });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: mockData }), { status: 200 }),
    );

    await getDirectorStudents(
      { admissionYear: 2026, ownerId: "STAFF-1" },
      { baseUrl: "http://frappe:8000" },
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.director_students.get_director_students?admissionYear=2026&ownerId=STAFF-1",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("passes assignment, lifecycle, and province filters to the students endpoint", async () => {
    const mockData = computeDirectorStudents({ admissionYear: 2026 });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: mockData }), { status: 200 }),
    );

    await getDirectorStudents(
      {
        admissionYear: 2026,
        provinceId: "PROVINCE-01",
        assignmentStatus: "assigned",
        lifecycleStatus: "Applicant",
      },
      { baseUrl: "http://frappe:8000" },
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.director_students.get_director_students?admissionYear=2026&provinceId=PROVINCE-01&assignmentStatus=assigned&lifecycleStatus=Applicant",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("throws DirectorStudentsApiError on authorization failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ error: { code: "FORBIDDEN", message: "Không có quyền truy cập." } }),
        { status: 403 },
      ),
    );

    await expect(
      getDirectorStudents({ admissionYear: 2026 }, { baseUrl: "http://frappe:8000" }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<DirectorStudentsApiError>>({
        status: 403,
        code: "FORBIDDEN",
      }),
    );
  });

  it("rejects invalid students envelope with 502", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: { data: "not-an-array" } }), { status: 200 }),
    );

    await expect(
      getDirectorStudents({ admissionYear: 2026 }, { baseUrl: "http://frappe:8000" }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<DirectorStudentsApiError>>({
        status: 502,
        code: "INVALID_STUDENTS_RESPONSE",
      }),
    );
  });

  it("rejects a student list record without an ownership revision", async () => {
    const payload = computeDirectorStudents({ admissionYear: 2026 });
    const firstRecord = payload.data[0] as unknown as Record<string, unknown>;
    delete firstRecord.revision;

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: payload }), { status: 200 }),
    );

    await expect(
      getDirectorStudents({ admissionYear: 2026 }, { baseUrl: "http://frappe:8000" }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<DirectorStudentsApiError>>({
        status: 502,
        code: "INVALID_STUDENTS_RESPONSE",
      }),
    );
  });

  it("calls Frappe get_director_student and maps 404 to null", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ error: { code: "STUDENT_NOT_FOUND", message: "Không tìm thấy hồ sơ." } }),
        { status: 404 },
      ),
    );

    const result = await getStudent360("non-existent-student", { baseUrl: "http://frappe:8000" });

    expect(result).toBeNull();
  });

  it("calls Frappe get_director_student successfully with valid payload", async () => {
    const mockStudent = computeStudent360("nguyen-minh-an");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: mockStudent }), { status: 200 }),
    );

    const result = await getStudent360("nguyen-minh-an", { baseUrl: "http://frappe:8000" });

    expect(result).not.toBeNull();
    expect(result?.student.name).toBe("Nguyễn Minh An");
  });

  it("rejects invalid student 360 envelope with 502", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: { student: { name: 123 } } }), { status: 200 }),
    );

    await expect(
      getStudent360("nguyen-minh-an", { baseUrl: "http://frappe:8000" }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<DirectorStudentsApiError>>({
        status: 502,
        code: "INVALID_STUDENT_RESPONSE",
      }),
    );
  });

  it("returns empty interactions response when offline", async () => {
    const result = await getStudentInteractions("ENR-1");

    expect(result).toEqual({
      student_id: "ENR-1",
      zalo_messages: [],
      calls: [],
      total_interactions: 0,
    });
  });

  it("calls Frappe get_student_interactions endpoint and parses payload", async () => {
    const mockPayload = {
      student_id: "ENR-1",
      zalo_messages: [
        {
          id: "INTX-1",
          time: "06/06/2026 · 16:42",
          senderName: "Nguyễn Văn Minh",
          recipientName: "Trần Quốc Bảo",
          content: "Hỏi học phí",
          direction: "inbound" as const,
        },
      ],
      calls: [],
      total_interactions: 1,
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: mockPayload }), { status: 200 }),
    );

    const result = await getStudentInteractions("ENR-1", { baseUrl: "http://frappe:8000" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.director_students.get_student_interactions?student_id=ENR-1",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(result).toEqual(mockPayload);
  });

  it("maps 404 to null for getStudentInteractions", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: { code: "STUDENT_NOT_FOUND" } }), { status: 404 }),
    );

    const result = await getStudentInteractions("non-existent", { baseUrl: "http://frappe:8000" });

    expect(result).toBeNull();
  });

  it("calls the Chatwoot interactions endpoint with pagination and parses payload", async () => {
    const mockPayload = {
      student_id: "ENR-1",
      data: [
        {
          name: "INTX-CHATWOOT-1",
          interaction_type: "Tin nhắn Chatwoot",
          interaction_datetime: "2026-09-04 12:47:31",
        },
      ],
      zalo_messages: [
        {
          id: "INTX-CHATWOOT-1",
          time: "04/09/2026 · 12:47",
          senderName: "Nguyễn Minh An",
          recipientName: "Tư vấn viên",
          content: "Em muốn hỏi học phí.",
          direction: "inbound" as const,
        },
      ],
      meta: { page: 2, page_size: 10, total: 11, has_next_page: true },
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: mockPayload }), { status: 200 }),
    );

    const result = await getStudentChatwootInteractions("ENR-1", {
      baseUrl: "http://frappe:8000",
      page: 2,
      pageSize: 10,
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.director_students.get_student_chatwoot_interactions?student_id=ENR-1&page=2&page_size=10",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(result).toEqual(mockPayload);
  });

  it("returns null when the Chatwoot interactions student is not found", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: { code: "STUDENT_NOT_FOUND" } }), { status: 404 }),
    );

    const result = await getStudentChatwootInteractions("non-existent", {
      baseUrl: "http://frappe:8000",
    });

    expect(result).toBeNull();
  });

  it("rejects an invalid Chatwoot interactions envelope", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: { data: [] } }), { status: 200 }),
    );

    await expect(
      getStudentChatwootInteractions("ENR-1", { baseUrl: "http://frappe:8000" }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<DirectorStudentsApiError>>({
        status: 502,
        code: "INVALID_CHATWOOT_INTERACTIONS_RESPONSE",
      }),
    );
  });
});
