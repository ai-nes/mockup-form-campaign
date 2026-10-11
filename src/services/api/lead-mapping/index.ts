import type {
  CreatePublicLeadPayload,
  CreatePublicLeadResponse,
  LookupItem,
  PublicCampaignRecord,
  RequestOptions,
} from "./types";
import { LeadMappingApiError } from "./types";

export type * from "./types";

/** Các lời gọi đi qua route proxy cùng origin tới crm-backend (`/api/v1/...`). */
const API = "/api/backend";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** crm-backend trả lỗi dạng `{ error: { code, message, details[] } }`. */
function toApiError(status: number, body: unknown): LeadMappingApiError {
  const error = asRecord(asRecord(body)?.error);
  const code = typeof error?.code === "string" ? error.code : `HTTP_${status}`;
  const details = Array.isArray(error?.details) ? error.details : [];
  const firstDetail = asRecord(details[0]);
  const detail = typeof firstDetail?.message === "string" ? firstDetail.message : "";
  const fallback =
    status === 429
      ? "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút."
      : status === 404
        ? "Chiến dịch không tồn tại hoặc đã đóng."
        : `Gửi thông tin thất bại (${status}).`;
  const message = typeof error?.message === "string" ? error.message : fallback;
  return new LeadMappingApiError(status, code, detail ? `${message} ${detail}` : message);
}

async function getItems<T>(path: string, options: RequestOptions): Promise<T[]> {
  const response = await fetch(`${API}/${path}`, {
    method: "GET",
    credentials: "omit",
    headers: { Accept: "application/json", ...options.headers },
    signal: options.signal,
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw toApiError(response.status, body);
  const items = asRecord(body)?.items;
  return Array.isArray(items) ? (items as T[]) : [];
}

export async function createPublicLead(
  payload: CreatePublicLeadPayload,
  options: RequestOptions = {},
): Promise<CreatePublicLeadResponse> {
  const fields = {
    studentName: payload.student_name,
    campaignCode: payload.campaign_code,
    campusId: payload.campus_id || undefined,
    phone: payload.phone,
    email: payload.email || undefined,
    provinceId: payload.province || undefined,
    wardId: payload.ward || undefined,
    highSchoolId: payload.high_school || undefined,
    majorId: payload.major || undefined,
    assignmentPriority: payload.assignment_priority,
  };

  const response = await fetch(`${API}/leads/intake`, {
    method: "POST",
    credentials: "omit",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      // Gửi lại cùng một lượt đăng ký không tạo thêm hồ sơ.
      "Idempotency-Key": crypto.randomUUID(),
      ...options.headers,
    },
    body: JSON.stringify(fields),
    signal: options.signal,
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw toApiError(response.status, body);

  const data = asRecord(asRecord(body)?.data);
  if (typeof data?.id !== "string" || typeof data.leadCode !== "string") {
    throw new LeadMappingApiError(response.status, "INVALID_RESPONSE", "Phản hồi từ máy chủ không hợp lệ.");
  }
  return { id: data.id, leadCode: data.leadCode };
}

export function getPublicProvinces(options: RequestOptions = {}): Promise<LookupItem[]> {
  return getItems<LookupItem>("public/provinces", options);
}

export async function getPublicWards(province: string, options: RequestOptions = {}): Promise<LookupItem[]> {
  if (!province) return [];
  return getItems<LookupItem>(`public/wards?province=${encodeURIComponent(province)}`, options);
}

export async function getPublicHighSchools(ward: string, options: RequestOptions = {}): Promise<LookupItem[]> {
  if (!ward) return [];
  return getItems<LookupItem>(`public/high-schools?ward=${encodeURIComponent(ward)}`, options);
}

export function getPublicMajors(options: RequestOptions = {}): Promise<LookupItem[]> {
  return getItems<LookupItem>("public/majors", options);
}

export function getPublicCampuses(options: RequestOptions = {}): Promise<LookupItem[]> {
  return getItems<LookupItem>("public/campuses", options);
}

/** Chiến dịch đang chạy; có `campaignCode` thì chỉ trả đúng chiến dịch đó. */
export async function getPublicCampaigns(
  campaignCode?: string,
  options: RequestOptions = {},
): Promise<PublicCampaignRecord[]> {
  const query = campaignCode ? `?code=${encodeURIComponent(campaignCode)}` : "";
  const items = await getItems<Record<string, unknown>>(`public/campaigns${query}`, options);
  return items.map((item) => ({
    name: String(item.code ?? item.value),
    code: (item.code as string | null) ?? null,
    stable_code: (item.code as string | null) ?? null,
    title: item.title as string | undefined,
    status: item.status as string | undefined,
    campus_id: item.campus_id as string | undefined,
    campus: item.campus as string | undefined,
    start_date: item.start_date as string | null | undefined,
    end_date: item.end_date as string | null | undefined,
    utm_campaign: item.utm_campaign as string | null | undefined,
  }));
}
