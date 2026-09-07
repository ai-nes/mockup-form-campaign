import {
  getStudentStudyStageForPayload,
  normalizeStudentStudyStage,
} from "./student-study-stage";

export type StudentUpdateFieldValue = string | null;

export type StudentUpdateFields = Partial<{
  student_name: StudentUpdateFieldValue;
  phone: StudentUpdateFieldValue;
  email: StudentUpdateFieldValue;
  other_email: StudentUpdateFieldValue;
  gender: StudentUpdateFieldValue;
  date_of_birth: StudentUpdateFieldValue;
  province: StudentUpdateFieldValue;
  ward: StudentUpdateFieldValue;
  high_school: StudentUpdateFieldValue;
  current_grade: StudentUpdateFieldValue;
  study_stage: StudentUpdateFieldValue;
  branch: StudentUpdateFieldValue;
  major: StudentUpdateFieldValue;
  aspiration: StudentUpdateFieldValue;
  advertising_channel: StudentUpdateFieldValue;
  conversion_potential: StudentUpdateFieldValue;
  segments: StudentUpdateFieldValue;
  admission_year: StudentUpdateFieldValue;
  alt_name: StudentUpdateFieldValue;
  alt_phone: StudentUpdateFieldValue;
  alt_address: StudentUpdateFieldValue;
  notes: StudentUpdateFieldValue;
  id_number: StudentUpdateFieldValue;
  id_issued_date: StudentUpdateFieldValue;
  id_issued_place: StudentUpdateFieldValue;
}>;

export type StudentCreateFields = StudentUpdateFields & {
  student_name: string;
};

export type LeadCreateFields = {
  student_name: string;
  phone: string;
  province: string;
  source: string;
  email?: string | null;
  other_email?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  high_school?: string | null;
  major?: string | null;
  current_grade?: string | null;
  study_stage?: string | null;
  advertising_channel?: string | null;
  segments?: string | null;
  admission_year?: string | null;
  conversion_potential?: string | null;
  enrollment_status?: string | null;
  assigned_to?: string | null;
  branch?: string | null;
  tags?: string | null;
  aspiration?: string | null;
  event_participated?: string | null;
  description?: string | null;
  ward?: string | null;
  alt_name?: string | null;
  alt_phone?: string | null;
  alt_address?: string | null;
};

export type SchoolUpdateFieldValue = string | number | null;

export type SchoolUpdateFields = Partial<{
  school_name: SchoolUpdateFieldValue;
  school_type: SchoolUpdateFieldValue;
  school_area: SchoolUpdateFieldValue;
  school_tier: SchoolUpdateFieldValue;
  boarding_type: SchoolUpdateFieldValue;
  province: SchoolUpdateFieldValue;
  ward: SchoolUpdateFieldValue;
  latitude: SchoolUpdateFieldValue;
  longitude: SchoolUpdateFieldValue;
  address: SchoolUpdateFieldValue;
  phone: SchoolUpdateFieldValue;
  email: SchoolUpdateFieldValue;
}>;

export type SchoolCreateFields = SchoolUpdateFields & {
  school_name: string;
  school_code: string;
  province: string;
  ward: string;
};

export type CrudFieldValue = string | number | boolean | null;

export interface StudentSchoolRecord<TFields = Record<string, unknown>> {
  doctype: "CRM Lead" | "CRM High School";
  name: string;
  fields: TFields;
}

export interface SchoolListRecord {
  name: string;
  fields: Record<string, unknown>;
}

export interface GetSchoolsResponse {
  doctype: "CRM High School";
  filters: Record<string, unknown>;
  schools: SchoolListRecord[];
}

export interface FieldOption {
  value: string;
  label: string;
}

export interface GetFieldOptionsResponse {
  doctype: "CRM Lead" | "CRM High School";
  fieldname: string;
  fieldtype: "Link" | "Select";
  target_doctype: string | null;
  options: FieldOption[];
}

export interface LeadOption extends FieldOption {
  user?: string | null;
}

export interface GetLeadOptionsResponse {
  staff: LeadOption[];
  segments: LeadOption[];
  events: LeadOption[];
  advertising_channel: FieldOption[];
}

export interface LeadImportError {
  row: number;
  code: string;
  message: string;
}

export interface LeadImportResponse {
  filename: string | null;
  total: number;
  created: number;
  failed: number;
  students: Array<{ row: number; name: string }>;
  errors: LeadImportError[];
}

export interface GetSchoolsParams {
  province?: string;
  ward?: string;
  search?: string;
  limit?: number;
}

export interface GetFieldOptionsParams {
  doctype: "CRM Lead" | "CRM High School";
  fieldname: string;
  search?: string;
  filters?: Record<string, CrudFieldValue>;
  province?: string;
  limit?: number;
}

export interface UpdateRecordResponse<TFields> {
  doctype: "CRM Lead" | "CRM High School";
  name: string;
  updated_fields: TFields;
}

export interface CreateRecordResponse<TFields> {
  doctype: "CRM Lead" | "CRM High School";
  name: string;
  created_fields: TFields;
}

export interface DeleteRecordResponse {
  doctype: "CRM Lead" | "CRM High School";
  name: string;
  deleted: true;
}

export class StudentSchoolUpdateApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "StudentSchoolUpdateApiError";
  }
}

/**
 * Keeps the CRUD payload aligned with CRM Lead's grade/study-stage contract.
 * The backend deliberately does not infer study_stage, so the client must
 * remove an unknown or incompatible stage instead of sending a wrong value.
 */
export function normalizeStudentFields<TFields extends StudentUpdateFields>(
  fields: TFields,
): TFields {
  const normalizedFields = { ...fields } as TFields;

  if (
    "study_stage" in normalizedFields &&
    !("current_grade" in normalizedFields)
  ) {
    const normalizedStage = normalizeStudentStudyStage(
      normalizedFields.study_stage,
    );
    if (normalizedStage) {
      normalizedFields.study_stage = normalizedStage;
    } else {
      delete normalizedFields.study_stage;
    }
    return normalizedFields;
  }

  if ("current_grade" in normalizedFields) {
    const normalizedGrade =
      typeof normalizedFields.current_grade === "string"
        ? normalizedFields.current_grade.trim()
        : normalizedFields.current_grade;
    if (normalizedGrade !== normalizedFields.current_grade) {
      normalizedFields.current_grade = normalizedGrade;
    }

    const studyStage = getStudentStudyStageForPayload(
      normalizedGrade,
      normalizedFields.study_stage,
    );
    if (studyStage) {
      normalizedFields.study_stage = studyStage;
    } else {
      delete normalizedFields.study_stage;
    }
  }

  return normalizedFields;
}

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_FRAPPE_URL ?? "").replace(/\/+$/, "");
}

async function getRequestHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (typeof window === "undefined") return headers;

  const cookieToken = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("csrf_token="))
    ?.split("=")
    .slice(1)
    .join("=");

  if (cookieToken) {
    headers["X-Frappe-CSRF-Token"] = decodeURIComponent(cookieToken);
    return headers;
  }

  try {
    const response = await fetch(
      `${getBaseUrl()}/api/method/crm.api.session.me`,
      {
        credentials: "include",
        headers: { Accept: "application/json" },
      },
    );
    const payload = (await response.json().catch(() => null)) as {
      message?: { csrf_token?: unknown };
    } | null;
    if (typeof payload?.message?.csrf_token === "string") {
      headers["X-Frappe-CSRF-Token"] = payload.message.csrf_token;
    }
  } catch {
    // The write request returns the authoritative CSRF error if needed.
  }

  return headers;
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getErrorDetails(
  payload: unknown,
  status: number,
  operation: "create" | "read" | "update" | "delete",
) {
  const root =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};
  const message =
    root.message && typeof root.message === "object"
      ? (root.message as Record<string, unknown>)
      : {};
  const error =
    root.error && typeof root.error === "object"
      ? (root.error as Record<string, unknown>)
      : {};

  return {
    code:
      text(error.code) ??
      text(message.code) ??
      (status === 401
        ? "UNAUTHENTICATED"
        : status === 403
          ? "FORBIDDEN"
          : `HTTP_${status}`),
    message:
      text(error.message) ??
      text(message.message) ??
      text(root.exception) ??
      (typeof root.message === "string" ? root.message : null) ??
      `${getOperationLabel(operation)} (${status}).`,
  };
}

function getOperationLabel(operation: "create" | "read" | "update" | "delete") {
  if (operation === "create") return "Không thể tạo bản ghi";
  if (operation === "delete") return "Không thể xóa bản ghi";
  if (operation === "read") return "Không thể tải dữ liệu";
  return "Không thể cập nhật dữ liệu";
}

function assertObject(
  value: unknown,
): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object") {
    throw new StudentSchoolUpdateApiError(
      502,
      "INVALID_API_RESPONSE",
      "Phản hồi từ CRM không hợp lệ.",
    );
  }
}

function getMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return payload;
  const root = payload as Record<string, unknown>;
  return root.message ?? payload;
}

function getReadRequestInit(): RequestInit {
  return {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
    cache: "no-store",
  };
}

async function readRecord<TFields>(
  method: "get_student" | "get_school",
  name: string,
): Promise<StudentSchoolRecord<TFields>> {
  const normalizedName = name.trim();
  if (!normalizedName) {
    throw new StudentSchoolUpdateApiError(
      400,
      "INVALID_NAME",
      "Thiếu tên bản ghi cần tải.",
    );
  }

  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new StudentSchoolUpdateApiError(
      503,
      "STUDENT_SCHOOL_READ_UNAVAILABLE",
      "Chưa cấu hình Frappe CRM API nên không thể tải dữ liệu.",
    );
  }

  const url = new URL(`${baseUrl}/api/method/crm.api.student_school.${method}`);
  url.searchParams.set("name", normalizedName);

  const response = await fetch(url.toString(), getReadRequestInit());
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = getErrorDetails(payload, response.status, "read");
    throw new StudentSchoolUpdateApiError(
      response.status,
      details.code,
      details.message,
    );
  }

  const message = getMessage(payload);
  assertObject(message);
  if (
    typeof message.doctype !== "string" ||
    typeof message.name !== "string" ||
    !message.fields ||
    typeof message.fields !== "object" ||
    Array.isArray(message.fields)
  ) {
    throw new StudentSchoolUpdateApiError(
      502,
      "INVALID_READ_RESPONSE",
      "Phản hồi đọc dữ liệu không hợp lệ.",
    );
  }

  return message as unknown as StudentSchoolRecord<TFields>;
}

export function getStudent<TFields = Record<string, unknown>>(name: string) {
  return readRecord<TFields>("get_student", name);
}

export function getSchool<TFields = Record<string, unknown>>(name: string) {
  return readRecord<TFields>("get_school", name);
}

function addOptionalQueryParam(
  searchParams: URLSearchParams,
  key: string,
  value: string | number | undefined,
) {
  if (typeof value === "number" || value?.trim()) {
    searchParams.set(key, String(value));
  }
}

async function readSchools(
  params: GetSchoolsParams = {},
): Promise<GetSchoolsResponse> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new StudentSchoolUpdateApiError(
      503,
      "STUDENT_SCHOOL_READ_UNAVAILABLE",
      "Chưa cấu hình Frappe CRM API nên không thể tải dữ liệu trường.",
    );
  }

  const url = new URL(
    `${baseUrl}/api/method/crm.api.student_school.get_schools`,
  );
  addOptionalQueryParam(url.searchParams, "province", params.province);
  addOptionalQueryParam(url.searchParams, "ward", params.ward);
  addOptionalQueryParam(url.searchParams, "search", params.search);
  addOptionalQueryParam(url.searchParams, "limit", params.limit);

  const response = await fetch(url.toString(), getReadRequestInit());
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = getErrorDetails(payload, response.status, "read");
    throw new StudentSchoolUpdateApiError(
      response.status,
      details.code,
      details.message,
    );
  }

  const message = getMessage(payload);
  assertObject(message);
  if (
    message.doctype !== "CRM High School" ||
    !Array.isArray(message.schools) ||
    message.schools.some((school) => {
      if (!school || typeof school !== "object" || Array.isArray(school)) {
        return true;
      }
      const item = school as Record<string, unknown>;
      return (
        typeof item.name !== "string" ||
        !item.fields ||
        typeof item.fields !== "object" ||
        Array.isArray(item.fields)
      );
    })
  ) {
    throw new StudentSchoolUpdateApiError(
      502,
      "INVALID_SCHOOLS_RESPONSE",
      "Phản hồi danh sách trường không hợp lệ.",
    );
  }

  return {
    doctype: "CRM High School",
    filters:
      message.filters &&
      typeof message.filters === "object" &&
      !Array.isArray(message.filters)
        ? (message.filters as Record<string, unknown>)
        : {},
    schools: message.schools as SchoolListRecord[],
  };
}

export function getSchools(params: GetSchoolsParams = {}) {
  return readSchools(params);
}

export async function getFieldOptions(
  params: GetFieldOptionsParams,
): Promise<GetFieldOptionsResponse> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new StudentSchoolUpdateApiError(
      503,
      "STUDENT_SCHOOL_READ_UNAVAILABLE",
      "Chưa cấu hình Frappe CRM API nên không thể tải danh sách lựa chọn.",
    );
  }

  const fieldname = params.fieldname.trim();
  if (!fieldname) {
    throw new StudentSchoolUpdateApiError(
      400,
      "INVALID_FIELDNAME",
      "Thiếu tên field cần tải lựa chọn.",
    );
  }

  const url = new URL(
    `${baseUrl}/api/method/crm.api.student_school.get_field_options`,
  );
  url.searchParams.set("doctype", params.doctype);
  url.searchParams.set("fieldname", fieldname);
  addOptionalQueryParam(url.searchParams, "search", params.search);
  addOptionalQueryParam(url.searchParams, "province", params.province);
  addOptionalQueryParam(url.searchParams, "limit", params.limit);
  if (params.filters && Object.keys(params.filters).length > 0) {
    url.searchParams.set("filters", JSON.stringify(params.filters));
  }

  const response = await fetch(url.toString(), getReadRequestInit());
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = getErrorDetails(payload, response.status, "read");
    throw new StudentSchoolUpdateApiError(
      response.status,
      details.code,
      details.message,
    );
  }

  const message = getMessage(payload);
  assertObject(message);
  if (
    (message.doctype !== "CRM Lead" && message.doctype !== "CRM High School") ||
    typeof message.fieldname !== "string" ||
    (message.fieldtype !== "Link" && message.fieldtype !== "Select") ||
    !(
      message.target_doctype === null ||
      typeof message.target_doctype === "string"
    ) ||
    !Array.isArray(message.options) ||
    message.options.some(
      (option) =>
        !option ||
        typeof option !== "object" ||
        typeof (option as Record<string, unknown>).value !== "string" ||
        typeof (option as Record<string, unknown>).label !== "string",
    )
  ) {
    throw new StudentSchoolUpdateApiError(
      502,
      "INVALID_FIELD_OPTIONS_RESPONSE",
      "Phản hồi danh sách lựa chọn không hợp lệ.",
    );
  }

  return message as unknown as GetFieldOptionsResponse;
}

export async function getLeadOptions(
  limit = 100,
): Promise<GetLeadOptionsResponse> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new StudentSchoolUpdateApiError(
      503,
      "STUDENT_SCHOOL_READ_UNAVAILABLE",
      "Chưa cấu hình Frappe CRM API nên không thể tải lựa chọn Lead.",
    );
  }

  const url = new URL(
    `${baseUrl}/api/method/crm.api.lead_mapping.get_lead_options`,
  );
  url.searchParams.set("limit", String(limit));
  const response = await fetch(url.toString(), getReadRequestInit());
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = getErrorDetails(payload, response.status, "read");
    throw new StudentSchoolUpdateApiError(
      response.status,
      details.code,
      details.message,
    );
  }

  const message = getMessage(payload);
  assertObject(message);
  if (
    !isLeadOptionArray(message.staff) ||
    !isLeadOptionArray(message.segments) ||
    !isLeadOptionArray(message.events) ||
    !isFieldOptionArray(message.advertising_channel)
  ) {
    throw new StudentSchoolUpdateApiError(
      502,
      "INVALID_LEAD_OPTIONS_RESPONSE",
      "Phản hồi lựa chọn Lead không hợp lệ.",
    );
  }

  return message as unknown as GetLeadOptionsResponse;
}

function isFieldOptionArray(value: unknown): value is FieldOption[] {
  return Array.isArray(value) && value.every(isFieldOption);
}

function isLeadOptionArray(value: unknown): value is LeadOption[] {
  return (
    Array.isArray(value) &&
    value.every((option) => {
      if (!isFieldOption(option)) return false;
      const user = (option as LeadOption).user;
      return user === undefined || user === null || typeof user === "string";
    })
  );
}

function isFieldOption(value: unknown): value is FieldOption {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof (value as Record<string, unknown>).value === "string" &&
    typeof (value as Record<string, unknown>).label === "string",
  );
}

async function updateRecord<TFields>(
  method: "update_student" | "update_school",
  name: string,
  fields: TFields,
): Promise<UpdateRecordResponse<TFields>> {
  const normalizedName = name.trim();
  if (!normalizedName) {
    throw new StudentSchoolUpdateApiError(
      400,
      "INVALID_NAME",
      "Thiếu tên bản ghi cần cập nhật.",
    );
  }
  if (
    !fields ||
    typeof fields !== "object" ||
    Object.keys(fields).length === 0
  ) {
    throw new StudentSchoolUpdateApiError(
      400,
      "INVALID_FIELDS",
      "Vui lòng thay đổi ít nhất một trường.",
    );
  }

  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new StudentSchoolUpdateApiError(
      503,
      "STUDENT_SCHOOL_UPDATE_UNAVAILABLE",
      "Chưa cấu hình Frappe CRM API nên không thể lưu thay đổi.",
    );
  }

  const response = await fetch(
    `${baseUrl}/api/method/crm.api.student_school.${method}`,
    {
      method: "POST",
      credentials: "include",
      headers: await getRequestHeaders(),
      body: JSON.stringify({ name: normalizedName, fields }),
    },
  );
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const details = getErrorDetails(payload, response.status, "update");
    throw new StudentSchoolUpdateApiError(
      response.status,
      details.code,
      details.message,
    );
  }

  const message = payload?.message ?? payload;
  if (
    !message ||
    typeof message !== "object" ||
    typeof message.name !== "string" ||
    !message.updated_fields ||
    typeof message.updated_fields !== "object"
  ) {
    throw new StudentSchoolUpdateApiError(
      502,
      "INVALID_UPDATE_RESPONSE",
      "Phản hồi cập nhật dữ liệu không hợp lệ.",
    );
  }

  return message as UpdateRecordResponse<TFields>;
}

export function updateStudent(name: string, fields: StudentUpdateFields) {
  return updateRecord("update_student", name, normalizeStudentFields(fields));
}

export function updateSchool(name: string, fields: SchoolUpdateFields) {
  return updateRecord("update_school", name, fields);
}

async function createRecord<TFields>(
  method: "create_student" | "create_school" | "create_lead",
  fields: TFields,
  apiModule: "student_school" | "lead_mapping" = "student_school",
): Promise<CreateRecordResponse<TFields>> {
  if (
    !fields ||
    typeof fields !== "object" ||
    Object.keys(fields as object).length === 0
  ) {
    throw new StudentSchoolUpdateApiError(
      400,
      "INVALID_FIELDS",
      "Vui lòng nhập thông tin để tạo bản ghi.",
    );
  }

  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new StudentSchoolUpdateApiError(
      503,
      "STUDENT_SCHOOL_CREATE_UNAVAILABLE",
      "Chưa cấu hình Frappe CRM API nên không thể tạo bản ghi.",
    );
  }

  const response = await fetch(
    `${baseUrl}/api/method/crm.api.${apiModule}.${method}`,
    {
      method: "POST",
      credentials: "include",
      headers: await getRequestHeaders(),
      body: JSON.stringify({ fields }),
    },
  );
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const details = getErrorDetails(payload, response.status, "create");
    throw new StudentSchoolUpdateApiError(
      response.status,
      details.code,
      details.message,
    );
  }

  const message = payload?.message ?? payload;
  assertObject(message);
  if (
    typeof message.name !== "string" ||
    !message.created_fields ||
    typeof message.created_fields !== "object"
  ) {
    throw new StudentSchoolUpdateApiError(
      502,
      "INVALID_CREATE_RESPONSE",
      "Phản hồi tạo bản ghi không hợp lệ.",
    );
  }

  return message as unknown as CreateRecordResponse<TFields>;
}

export function createStudent(fields: StudentCreateFields) {
  return createRecord("create_student", normalizeStudentFields(fields));
}

export function createLead(fields: LeadCreateFields) {
  return createRecord("create_lead", fields, "lead_mapping");
}

export async function importLeads(
  csvContent: string,
  filename?: string,
): Promise<LeadImportResponse> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new StudentSchoolUpdateApiError(
      503,
      "LEAD_IMPORT_UNAVAILABLE",
      "Chưa cấu hình Frappe CRM API nên không thể nhập CSV.",
    );
  }

  const response = await fetch(
    `${baseUrl}/api/method/crm.api.lead_mapping.import_leads`,
    {
      method: "POST",
      credentials: "include",
      headers: await getRequestHeaders(),
      body: JSON.stringify({ csv_content: csvContent, filename }),
    },
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = getErrorDetails(payload, response.status, "create");
    throw new StudentSchoolUpdateApiError(
      response.status,
      details.code,
      details.message,
    );
  }

  const message = payload?.message ?? payload;
  assertObject(message);
  if (
    typeof message.total !== "number" ||
    typeof message.created !== "number" ||
    typeof message.failed !== "number" ||
    !Array.isArray(message.errors) ||
    !Array.isArray(message.students)
  ) {
    throw new StudentSchoolUpdateApiError(
      502,
      "INVALID_LEAD_IMPORT_RESPONSE",
      "Phản hồi nhập CSV không hợp lệ.",
    );
  }
  return message as unknown as LeadImportResponse;
}

export function createSchool(fields: SchoolCreateFields) {
  return createRecord("create_school", fields);
}

async function deleteRecord(
  name: string,
  method: "delete_student" | "delete_school",
) {
  const normalizedName = name.trim();
  if (!normalizedName) {
    throw new StudentSchoolUpdateApiError(
      400,
      "INVALID_NAME",
      "Thiếu tên bản ghi cần xóa.",
    );
  }

  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new StudentSchoolUpdateApiError(
      503,
      "STUDENT_SCHOOL_DELETE_UNAVAILABLE",
      "Chưa cấu hình Frappe CRM API nên không thể xóa bản ghi.",
    );
  }

  const response = await fetch(
    `${baseUrl}/api/method/crm.api.student_school.${method}`,
    {
      method: "DELETE",
      credentials: "include",
      headers: await getRequestHeaders(),
      body: JSON.stringify({ name: normalizedName }),
    },
  );
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const details = getErrorDetails(payload, response.status, "delete");
    throw new StudentSchoolUpdateApiError(
      response.status,
      details.code,
      details.message,
    );
  }

  const message = payload?.message ?? payload;
  assertObject(message);
  if (typeof message.name !== "string" || message.deleted !== true) {
    throw new StudentSchoolUpdateApiError(
      502,
      "INVALID_DELETE_RESPONSE",
      "Phản hồi xóa bản ghi không hợp lệ.",
    );
  }

  return message as unknown as DeleteRecordResponse;
}

export function deleteStudent(name: string) {
  return deleteRecord(name, "delete_student");
}

export function deleteSchool(name: string) {
  return deleteRecord(name, "delete_school");
}
