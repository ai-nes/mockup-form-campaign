export interface RequestOptions {
  baseUrl?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface CreatePublicLeadPayload {
  student_name: string;
  campaign_code: string;
  phone?: string;
  email?: string;
  cccd?: string;
  province?: string;
  ward?: string;
  high_school?: string;
  major?: string;
  source?: string;
  assignment_priority?: "low" | "normal" | "high" | "urgent";
  segments?: string[];
}

export interface CreatePublicLeadResponse {
  doctype: string;
  name: string;
  lead_code: string;
  leadCode: string;
  lead_status: string;
  conversion_status: string;
  conversion_blockers: string;
  campaign: string;
  campaign_code: string;
  assigned_to: string;
  branch: string;
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
  code?: string;
  [key: string]: any;
}

export interface LookupResponse {
  items: LookupItem[];
  total: number;
}
