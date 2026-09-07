import type { CreatePublicLeadPayload, CreatePublicLeadResponse, RequestOptions } from "./types";
import { LeadMappingApiError } from "./types";

export type * from "./types";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function resolveBaseUrl(options: RequestOptions = {}): string {
  if (typeof window !== "undefined") {
    return ""; // Use relative path in browser to hit Next.js rewrites (CORS fix)
  }
  
  const baseUrl = (
    options.baseUrl ??
    process.env.NEXT_PUBLIC_FRAPPE_URL ??
    ""
  ).replace(/\/+$/, "");

  if (!baseUrl) {
    throw new LeadMappingApiError(
      0,
      "FRAPPE_URL_MISSING",
      "Chưa cấu hình địa chỉ Frappe API.",
    );
  }

  return baseUrl;
}

export async function createPublicLead(
  payload: CreatePublicLeadPayload,
  options: RequestOptions = {},
): Promise<CreatePublicLeadResponse> {
  const baseUrl = resolveBaseUrl(options);
  const url = `${baseUrl}/api/method/crm.api.lead_mapping.create_public_lead`;

  const requestInit: RequestInit = {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    // No credentials sent since this is a public API
    credentials: "omit",
    body: JSON.stringify({ fields: payload }),
    signal: options.signal,
  };

  let response: Response;
  try {
    response = await fetch(url, requestInit);
  } catch {
    throw new LeadMappingApiError(
      503,
      "LEAD_MAPPING_API_UNAVAILABLE",
      "Không thể kết nối đến máy chủ.",
    );
  }

  const responsePayload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const root = asRecord(responsePayload);
    const messageObj = asRecord(root?.message);
    const errorObj = asRecord(root?.error) ?? asRecord(messageObj?.error);
    let serverMessageStr = "";
    if (typeof root?._server_messages === "string") {
      try {
        const messages = JSON.parse(root._server_messages);
        if (Array.isArray(messages) && messages.length > 0) {
          const firstMsg = JSON.parse(messages[0]);
          serverMessageStr = firstMsg.message || "";
        }
      } catch (e) {}
    }

    const code =
      (typeof errorObj?.code === "string" && errorObj.code) ||
      (typeof root?.exception === "string" && root.exception) ||
      `HTTP_${response.status}`;
    let message =
      serverMessageStr ||
      (typeof errorObj?.message === "string" && errorObj.message) ||
      (typeof messageObj?.message === "string" && messageObj.message) ||
      (typeof root?.message === "string" && root.message) ||
      `Gửi thông tin thất bại (${response.status}).`;

    if (response.status === 417) {
      message = "Bạn đã đăng ký tham gia chiến dịch này rồi, không thể đăng ký lại.";
    }

    throw new LeadMappingApiError(response.status, code, message);
  }

  const root = asRecord(responsePayload);
  const messageData = root?.message !== undefined ? root.message : responsePayload;
  
  return messageData as CreatePublicLeadResponse;
}

export async function getPublicProvinces(options: RequestOptions = {}) {
  const baseUrl = resolveBaseUrl(options);
  const url = `${baseUrl}/api/method/crm.api.lead_mapping.get_public_provinces`;
  const response = await fetch(url, { method: "GET", credentials: "omit" });
  const data = await response.json();
  return data?.message?.items || [];
}

export async function getPublicWards(province: string, options: RequestOptions = {}) {
  if (!province) return [];
  const baseUrl = resolveBaseUrl(options);
  const url = `${baseUrl}/api/method/crm.api.lead_mapping.get_public_wards?province=${encodeURIComponent(province)}`;
  const response = await fetch(url, { method: "GET", credentials: "omit" });
  const data = await response.json();
  return data?.message?.items || [];
}

export async function getPublicHighSchools(ward: string, options: RequestOptions = {}) {
  if (!ward) return [];
  const baseUrl = resolveBaseUrl(options);
  const url = `${baseUrl}/api/method/crm.api.lead_mapping.get_public_high_schools?ward=${encodeURIComponent(ward)}`;
  const response = await fetch(url, { method: "GET", credentials: "omit" });
  const data = await response.json();
  return data?.message?.items || [];
}

export async function getPublicMajors(options: RequestOptions = {}) {
  const baseUrl = resolveBaseUrl(options);
  const url = `${baseUrl}/api/method/crm.api.lead_mapping.get_public_majors`;
  const response = await fetch(url, { method: "GET", credentials: "omit" });
  const data = await response.json();
  return data?.message?.items || [];
}
