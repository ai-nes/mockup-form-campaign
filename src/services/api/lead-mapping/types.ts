export interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/** Dữ liệu người dùng nhập; `province`/`ward`/`high_school`/`major` là `value` (id) của danh mục. */
export interface CreatePublicLeadPayload {
  student_name: string;
  campaign_code: string;
  campus_id?: string;
  phone?: string;
  email?: string;
  province?: string;
  ward?: string;
  high_school?: string;
  major?: string;
  assignment_priority?: "low" | "normal" | "high" | "urgent";
}

export interface CreatePublicLeadResponse {
  id: string;
  leadCode: string;
}

export class LeadMappingApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "LeadMappingApiError";
  }
}

export interface LookupItem {
  value: string;
  label: string;
  code?: string | null;
  major_group?: string | null;
  [key: string]: unknown;
}

export interface PublicLeadRecord {
  campus?: string;
  campus_id?: string;
  name?: string;
  lead_code?: string;
  student_name?: string;
  lead_status?: string | null;
  campaign?: string;
  creation?: string;
  createdAt?: string;
  phone?: string;
  email?: string;
  province?: string;
  ward?: string;
  high_school?: string;
  major?: string;
  campaign_code?: string;
}

export interface PublicCampaignRecord {
  campus_id?: string;
  name: string;
  stable_code?: string | null;
  code?: string | null;
  title?: string;
  status?: string;
  start_date?: string | null;
  end_date?: string | null;
  utm_campaign?: string | null;
  description?: string;
  campus?: string;
  platform?: string;
  utm_source?: string | null;
}
