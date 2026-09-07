export interface LeadSaleCampaign {
  name: string;
  stableCode: string;
  title: string;
  status: string;
}

export interface CampaignListResponse {
  campaigns: LeadSaleCampaign[];
  total: number;
}

export interface CampaignListParams {
  search?: string;
  start?: number;
  pageLength?: number;
  leadOnly?: boolean;
}

export interface CampaignApiRequestOptions {
  baseUrl?: string;
  headers?: Record<string, string>;
}

export class CampaignApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "CampaignApiError";
  }
}

const LIST_METHOD = "crm.api.campaign.list_campaigns";
const DEFAULT_PAGE_LENGTH = 100;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function count(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}

function unwrapMessage(value: unknown): unknown {
  const root = asRecord(value);
  return root?.message !== undefined ? root.message : value;
}

function normalizeCampaign(value: unknown): LeadSaleCampaign | null {
  const row = asRecord(value);
  const name = text(row?.name);
  if (!name) return null;
  return {
    name,
    stableCode: text(row?.stableCode ?? row?.stable_code),
    title: text(row?.title, name),
    status: text(row?.status),
  };
}

export function normalizeCampaignList(value: unknown): CampaignListResponse {
  const payload = asRecord(unwrapMessage(value));
  if (!payload || !Array.isArray(payload.campaigns)) {
    throw new Error("Invalid Campaign list response");
  }

  const campaigns = payload.campaigns
    .map(normalizeCampaign)
    .filter((campaign): campaign is LeadSaleCampaign => campaign !== null);

  if (campaigns.length !== payload.campaigns.length) {
    throw new Error("Invalid Campaign list response");
  }

  return {
    campaigns,
    total: count(payload.total),
  };
}

function resolveBaseUrl(options: CampaignApiRequestOptions): string {
  return (options.baseUrl ?? process.env.NEXT_PUBLIC_FRAPPE_URL ?? "").replace(
    /\/+$/,
    "",
  );
}

function frappeCookieHeader(cookieHeader: string): string {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.split("=", 1)[0] === "sid")
    .join("; ");
}

async function requestHeaders(
  options: CampaignApiRequestOptions,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers ?? {}),
  };
  if (!options.baseUrl && typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const cookieHeader = frappeCookieHeader((await cookies()).toString());
      if (cookieHeader) headers.Cookie = cookieHeader;
    } catch {
      // Contract tests and non-request contexts do not have Next headers.
    }
  }
  return headers;
}

function errorDetails(
  value: unknown,
  status: number,
): { code: string; message: string } {
  const root = asRecord(value);
  const message = asRecord(root?.message);
  const error = asRecord(root?.error) ?? asRecord(message?.error);
  return {
    code:
      text(error?.code) ||
      (status === 401
        ? "UNAUTHENTICATED"
        : status === 403
          ? "FORBIDDEN"
          : `HTTP_${status}`),
    message:
      text(error?.message) ||
      text(message?.message) ||
      text(root?.message) ||
      text(root?.exception) ||
      `Không thể tải danh sách campaign (${status}).`,
  };
}

export async function getCampaignList(
  params: CampaignListParams = {},
  options: CampaignApiRequestOptions = {},
): Promise<CampaignListResponse> {
  const baseUrl = resolveBaseUrl(options);
  if (!baseUrl) {
    throw new CampaignApiError(
      503,
      "CAMPAIGN_API_UNAVAILABLE",
      "Chưa cấu hình địa chỉ Frappe CRM API.",
    );
  }

  const search = params.search?.trim();
  const pageLength = Math.max(
    1,
    Math.floor(Number.isFinite(params.pageLength) ? params.pageLength! : DEFAULT_PAGE_LENGTH),
  );
  let nextStart = Math.max(
    0,
    Math.floor(Number.isFinite(params.start) ? params.start! : 0),
  );
  const campaigns: LeadSaleCampaign[] = [];
  let total = 0;

  while (true) {
    const searchParams = new URLSearchParams({
      start: String(nextStart),
      page_length: String(pageLength),
    });
    if (search) searchParams.set("search", search);
    if (params.leadOnly) searchParams.set("lead_only", "1");

    const url = `${baseUrl}/api/method/${LIST_METHOD}?${searchParams.toString()}`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers: await requestHeaders(options),
        ...(typeof window !== "undefined"
          ? { credentials: "include" as RequestCredentials }
          : {}),
        cache: "no-store",
      });
    } catch {
      throw new CampaignApiError(
        503,
        "CAMPAIGN_API_UNAVAILABLE",
        "Không thể kết nối đến máy chủ campaign.",
      );
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const details = errorDetails(payload, response.status);
      throw new CampaignApiError(response.status, details.code, details.message);
    }

    let page: CampaignListResponse;
    try {
      page = normalizeCampaignList(payload);
    } catch {
      throw new CampaignApiError(
        502,
        "INVALID_CAMPAIGN_LIST_RESPONSE",
        "Phản hồi danh sách campaign không hợp lệ.",
      );
    }

    campaigns.push(...page.campaigns);
    total = page.total;
    if (
      page.campaigns.length < pageLength ||
      nextStart + page.campaigns.length >= total
    ) {
      break;
    }
    nextStart += page.campaigns.length;
  }

  return { campaigns, total };
}
