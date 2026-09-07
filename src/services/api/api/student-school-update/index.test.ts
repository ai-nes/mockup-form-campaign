import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createLead,
  createSchool,
  createStudent,
  deleteSchool,
  getFieldOptions,
  getLeadOptions,
  getSchool,
  getSchools,
  importLeads,
  getStudent,
  StudentSchoolUpdateApiError,
  updateSchool,
  updateStudent,
} from ".";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("student and school update contract", () => {
  it("reads a student through the documented RPC", async () => {
    vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "http://frappe:8000");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            doctype: "CRM Lead",
            name: "ENR-2026-00001",
            fields: { student_name: "Nguyễn Văn An" },
          },
        }),
        { status: 200 },
      ),
    );

    await expect(getStudent("ENR-2026-00001")).resolves.toMatchObject({
      doctype: "CRM Lead",
      name: "ENR-2026-00001",
      fields: { student_name: "Nguyễn Văn An" },
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.student_school.get_student?name=ENR-2026-00001",
      expect.objectContaining({
        method: "GET",
        credentials: "include",
      }),
    );
  });

  it("reads schools with the documented filters", async () => {
    vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "http://frappe:8000");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            doctype: "CRM High School",
            filters: { province: "PROVINCE-001", ward: "WARD-001" },
            schools: [
              {
                name: "SCHOOL-001",
                fields: { school_name: "THPT Nguyễn Huệ" },
              },
            ],
          },
        }),
        { status: 200 },
      ),
    );

    await expect(
      getSchools({
        province: "PROVINCE-001",
        ward: "WARD-001",
        search: "Nguyen",
        limit: 20,
      }),
    ).resolves.toMatchObject({ schools: [{ name: "SCHOOL-001" }] });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.student_school.get_schools?province=PROVINCE-001&ward=WARD-001&search=Nguyen&limit=20",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("loads dependent field options from the documented RPC", async () => {
    vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "http://frappe:8000");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            doctype: "CRM Lead",
            fieldname: "ward",
            fieldtype: "Link",
            target_doctype: "CRM Ward",
            options: [{ value: "WARD-001", label: "Phường An Bình" }],
          },
        }),
        { status: 200 },
      ),
    );

    await expect(
      getFieldOptions({
        doctype: "CRM Lead",
        fieldname: "ward",
        province: "PROVINCE-001",
        filters: { province: "PROVINCE-001" },
      }),
    ).resolves.toMatchObject({
      fieldname: "ward",
      options: [{ value: "WARD-001", label: "Phường An Bình" }],
    });

    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(
      "http://frappe:8000/api/method/crm.api.student_school.get_field_options?",
    );
    expect(url).toContain("doctype=CRM+Lead");
    expect(url).toContain("fieldname=ward");
    expect(url).toContain("province=PROVINCE-001");
    expect(url).toContain(
      `filters=${encodeURIComponent(JSON.stringify({ province: "PROVINCE-001" }))}`,
    );
  });

  it("posts only the requested student fields to the documented RPC", async () => {
    vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "http://frappe:8000");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            doctype: "CRM Lead",
            name: "ENR-2026-00001",
            updated_fields: { phone: "0900000000" },
          },
        }),
        { status: 200 },
      ),
    );

    await expect(
      updateStudent("ENR-2026-00001", { phone: "0900000000" }),
    ).resolves.toMatchObject({
      name: "ENR-2026-00001",
      updated_fields: { phone: "0900000000" },
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.student_school.update_student",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          name: "ENR-2026-00001",
          fields: { phone: "0900000000" },
        }),
      }),
    );
  });

  it("maps a deterministic grade to the matching study stage", async () => {
    vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "http://frappe:8000");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            doctype: "CRM Lead",
            name: "ENR-2026-00001",
            updated_fields: {
              current_grade: "10",
              study_stage: "grade_10",
            },
          },
        }),
        { status: 200 },
      ),
    );

    await updateStudent("ENR-2026-00001", { current_grade: "10" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.student_school.update_student",
      expect.objectContaining({
        body: JSON.stringify({
          name: "ENR-2026-00001",
          fields: { current_grade: "10", study_stage: "grade_10" },
        }),
      }),
    );
  });

  it("omits an unresolved or incompatible study stage", async () => {
    vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "http://frappe:8000");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            doctype: "CRM Lead",
            name: "ENR-2026-00001",
            updated_fields: { current_grade: "12" },
          },
        }),
        { status: 200 },
      ),
    );

    await updateStudent("ENR-2026-00001", {
      current_grade: "12",
      study_stage: "grade_10",
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.student_school.update_student",
      expect.objectContaining({
        body: JSON.stringify({
          name: "ENR-2026-00001",
          fields: { current_grade: "12" },
        }),
      }),
    );
  });

  it("uses the school RPC and preserves numeric coordinates", async () => {
    vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "http://frappe:8000");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            doctype: "CRM High School",
            name: "01-001-062",
            updated_fields: { latitude: 10.123, longitude: 105.456 },
          },
        }),
        { status: 200 },
      ),
    );

    await expect(
      updateSchool("01-001-062", { latitude: 10.123, longitude: 105.456 }),
    ).resolves.toMatchObject({
      updated_fields: { latitude: 10.123, longitude: 105.456 },
    });
  });

  it("surfaces backend validation errors", async () => {
    vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "http://frappe:8000");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: "VALIDATION_ERROR", message: "Email không hợp lệ." },
        }),
        { status: 422 },
      ),
    );

    await expect(
      updateStudent("ENR-2026-00001", { email: "invalid" }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<StudentSchoolUpdateApiError>>({
        status: 422,
        code: "VALIDATION_ERROR",
        message: "Email không hợp lệ.",
      }),
    );
  });

  it("reads a school through the documented RPC", async () => {
    vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "http://frappe:8000");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            doctype: "CRM High School",
            name: "SCHOOL-001",
            fields: { school_name: "THPT Nguyễn Huệ" },
          },
        }),
        { status: 200 },
      ),
    );

    await expect(getSchool("SCHOOL-001")).resolves.toMatchObject({
      doctype: "CRM High School",
      name: "SCHOOL-001",
    });
  });
});

describe("student and school create/delete contract", () => {
  it("creates a CSV-compatible Lead through the lead mapping RPC", async () => {
    vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "http://frappe:8000");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            doctype: "CRM Lead",
            name: "ENR-2026-00004",
            created_fields: {
              student_name: "Nguyễn Văn An",
              phone: "0900000000",
              province: "PROVINCE-001",
              source: "Promoter",
              assigned_to: "STAFF-001",
            },
          },
        }),
        { status: 200 },
      ),
    );

    await expect(
      createLead({
        student_name: "Nguyễn Văn An",
        phone: "0900000000",
        province: "PROVINCE-001",
        source: "Promoter",
        assigned_to: "sales@example.com",
      }),
    ).resolves.toMatchObject({ name: "ENR-2026-00004" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.lead_mapping.create_lead",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          fields: {
            student_name: "Nguyễn Văn An",
            phone: "0900000000",
            province: "PROVINCE-001",
            source: "Promoter",
            assigned_to: "sales@example.com",
          },
        }),
      }),
    );
  });

  it("loads Lead mapping options", async () => {
    vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "http://frappe:8000");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            staff: [
              {
                value: "sales@example.com",
                label: "Sales",
                user: "sales@example.com",
              },
            ],
            segments: [],
            events: [],
            advertising_channel: [{ value: "Facebook", label: "Facebook" }],
          },
        }),
        { status: 200 },
      ),
    );

    await expect(getLeadOptions()).resolves.toMatchObject({
      staff: [{ user: "sales@example.com" }],
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.lead_mapping.get_lead_options?limit=100",
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );
  });

  it("imports CSV content through the lead mapping RPC", async () => {
    vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "http://frappe:8000");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            filename: "leads.csv",
            total: 2,
            created: 1,
            failed: 1,
            students: [{ row: 2, name: "ENR-2026-00005" }],
            errors: [
              { row: 3, code: "INVALID_PHONE", message: "Invalid phone" },
            ],
          },
        }),
        { status: 200 },
      ),
    );

    await expect(
      importLeads("Họ và Tên,Di động\nNguyễn Văn An,0900000000", "leads.csv"),
    ).resolves.toMatchObject({ total: 2, created: 1, failed: 1 });
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.lead_mapping.import_leads",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          csv_content: "Họ và Tên,Di động\nNguyễn Văn An,0900000000",
          filename: "leads.csv",
        }),
      }),
    );
  });

  it("creates a student through the documented RPC", async () => {
    vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "http://frappe:8000");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            doctype: "CRM Lead",
            name: "ENR-2026-00002",
            created_fields: { student_name: "Nguyễn Văn An" },
          },
        }),
        { status: 200 },
      ),
    );

    await expect(
      createStudent({ student_name: "Nguyễn Văn An", phone: "0900000000" }),
    ).resolves.toMatchObject({
      name: "ENR-2026-00002",
      created_fields: { student_name: "Nguyễn Văn An" },
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.student_school.create_student",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          fields: { student_name: "Nguyễn Văn An", phone: "0900000000" },
        }),
      }),
    );
  });

  it("sends the selected semester for a grade 12 student", async () => {
    vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "http://frappe:8000");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            doctype: "CRM Lead",
            name: "ENR-2026-00003",
            created_fields: {
              student_name: "Nguyễn Văn An",
              current_grade: "12",
              study_stage: "grade_12_h1",
            },
          },
        }),
        { status: 200 },
      ),
    );

    await createStudent({
      student_name: "Nguyễn Văn An",
      current_grade: "12",
      study_stage: "grade_12_h1",
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.student_school.create_student",
      expect.objectContaining({
        body: JSON.stringify({
          fields: {
            student_name: "Nguyễn Văn An",
            current_grade: "12",
            study_stage: "grade_12_h1",
          },
        }),
      }),
    );
  });

  it("creates a school and sends the required identity fields", async () => {
    vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "http://frappe:8000");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            doctype: "CRM High School",
            name: "8b7f2c1a9d",
            created_fields: {
              school_name: "THPT Nguyễn Huệ",
              school_code: "NH-001",
              province: "PROVINCE-001",
              ward: "WARD-001",
            },
          },
        }),
        { status: 200 },
      ),
    );

    await createSchool({
      school_name: "THPT Nguyễn Huệ",
      school_code: "NH-001",
      province: "PROVINCE-001",
      ward: "WARD-001",
      latitude: 10.123,
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.student_school.create_school",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          fields: {
            school_name: "THPT Nguyễn Huệ",
            school_code: "NH-001",
            province: "PROVINCE-001",
            ward: "WARD-001",
            latitude: 10.123,
          },
        }),
      }),
    );
  });

  it("deletes a school with HTTP DELETE and the record name", async () => {
    vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "http://frappe:8000");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            doctype: "CRM High School",
            name: "8b7f2c1a9d",
            deleted: true,
          },
        }),
        { status: 200 },
      ),
    );

    await expect(deleteSchool("8b7f2c1a9d")).resolves.toMatchObject({
      name: "8b7f2c1a9d",
      deleted: true,
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://frappe:8000/api/method/crm.api.student_school.delete_school",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ name: "8b7f2c1a9d" }),
      }),
    );
  });
});
