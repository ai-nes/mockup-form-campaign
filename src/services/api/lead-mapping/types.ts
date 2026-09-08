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
  lead_status?: string;
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

export interface PublicLeadRecord {
  name?: string;
  lead_code?: string;
  student_name?: string;
  lead_status?: string | null;
  campaign?: string;
  creation?: string;
  createdAt?: string; // Client fallback
  
  // Sensitive fields removed from API response, kept optional for local pending lead
  phone?: string;
  email?: string;
  province?: string;
  ward?: string;
  high_school?: string;
  major?: string;
  campaign_code?: string;
  [key: string]: any;
}

export interface PublicCampaignRecord {
  name: string;
  stable_code?: string;
  code?: string;
  title?: string;
  campus?: string;
  campaign_type?: string;
  event_type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  platform?: string;
  channel_boundary?: string;
  channel_type?: string;
  channel_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  description?: string;
  [key: string]: any;
}
