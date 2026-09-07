import type {
  InteractionCatalog,
  InteractionCatalogItem,
  InteractionDetailResponse,
  InteractionEvidence,
  InteractionFeedFilters,
  InteractionFeedResponse,
  InteractionRequestOptions,
  InteractionSummary,
  InteractionTarget,
  InteractionType,
  IntentImportance,
  IntentType,
} from "./types";

export type * from "./types";

const METHODS = {
  LIST: "crm.api.interaction_read.list_interactions",
  DETAIL: "crm.api.interaction_read.get_interaction_detail",
  EVIDENCE: "crm.api.interaction_read.get_interaction_evidence",
  GET_LIST: "frappe.client.get_list",
} as const;

const INTERACTION_FIELDS = [
  "name",
  "code",
  "display_name",
  "enabled",
  "sort_order",
  "description",
];

export class InteractionIntelligenceApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "InteractionIntelligenceApiError";
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function unwrapMessage(value: unknown): unknown {
  const root = asRecord(value);
  return root && root.message !== undefined ? root.message : value;
}

function resolveBaseUrl(options: InteractionRequestOptions = {}): string {
  const baseUrl = (
    options.baseUrl ??
    process.env.NEXT_PUBLIC_FRAPPE_URL ??
    ""
  ).replace(/\/+$/, "");

  if (!baseUrl) {
    throw new InteractionIntelligenceApiError(
      0,
      "FRAPPE_URL_MISSING",
      "Chưa cấu hình địa chỉ Frappe CRM API.",
    );
  }

  return baseUrl;
}

function frappeCookieHeader(cookieHeader: string): string {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.split("=", 1)[0] === "sid")
    .join("; ");
}

async function requestHeaders(
  options: InteractionRequestOptions = {},
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
      // Tests and non-request contexts do not have a Next headers context.
    }
  }

  return headers;
}

function readError(
  value: unknown,
  status: number,
): { code: string; message: string } {
  const root = asRecord(value);
  const message = asRecord(root?.message);
  const error = asRecord(root?.error) ?? asRecord(message?.error);

  return {
    code:
      (typeof error?.code === "string" && error.code) ||
      (typeof root?.exception === "string" && root.exception) ||
      `HTTP_${status}`,
    message:
      (typeof error?.message === "string" && error.message) ||
      (typeof message?.message === "string" && message.message) ||
      (typeof root?.message === "string" && root.message) ||
      `Không thể tải dữ liệu tương tác (${status}).`,
  };
}

async function callFrappeRpc<T>(
  method: string,
  params: Record<string, string>,
  options: InteractionRequestOptions = {},
): Promise<T> {
  const baseUrl = resolveBaseUrl(options);
  const endpoint = `${baseUrl}/api/method/${method}`;
  const query = new URLSearchParams(params);
  const headers = await requestHeaders(options);

  let response: Response;
  try {
    response = await fetch(`${endpoint}?${query.toString()}`, {
      headers,
      ...(typeof window !== "undefined"
        ? { credentials: "include" as RequestCredentials }
        : {}),
      cache: "no-store",
    });
  } catch {
    throw new InteractionIntelligenceApiError(
      503,
      "INTERACTION_API_UNAVAILABLE",
      "Không thể kết nối đến máy chủ Interaction Intelligence.",
    );
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = readError(payload, response.status);
    throw new InteractionIntelligenceApiError(
      response.status,
      error.code,
      error.message,
    );
  }

  return unwrapMessage(payload) as T;
}

function normalizeString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function normalizeSummary(value: unknown): InteractionSummary | null {
  const item = asRecord(value);
  const id = normalizeString(item?.id);
  const interactionType = normalizeString(item?.interaction_type);
  if (!id || !interactionType) return null;
  const hasEvidence =
    typeof item?.has_evidence === "boolean"
      ? item.has_evidence
      : typeof item?.evidence_available === "boolean"
        ? item.evidence_available
        : false;

  return {
    id,
    occurred_at: normalizeString(item?.occurred_at),
    interaction_type: interactionType,
    interaction_label: normalizeString(item?.interaction_label),
    channel: normalizeString(item?.channel),
    direction: normalizeString(item?.direction),
    outcome: normalizeString(item?.outcome),
    summary: normalizeString(item?.summary),
    episode_state: normalizeString(item?.episode_state),
    analysis_state: normalizeString(item?.analysis_state),
    semantic: asRecord(item?.semantic) as InteractionSummary["semantic"],
    source_type:
      normalizeString(item?.source_type) ??
      normalizeString(item?.reference_doctype),
    source_id:
      normalizeString(item?.source_id) ??
      normalizeString(item?.reference_docname),
    source_revision:
      typeof item?.source_revision === "number" ? item.source_revision : null,
    has_evidence: hasEvidence,
    evidence_available: hasEvidence,
  };
}

function normalizeFeed(value: unknown): InteractionFeedResponse {
  const payload = asRecord(value);
  const rawItems = Array.isArray(payload?.items) ? payload.items : [];
  const items = rawItems
    .map(normalizeSummary)
    .filter((item): item is InteractionSummary => item !== null);

  if (!Array.isArray(payload?.items)) {
    throw new InteractionIntelligenceApiError(
      502,
      "INVALID_INTERACTION_FEED_RESPONSE",
      "Phản hồi danh sách tương tác không hợp lệ.",
    );
  }

  return {
    contract_version: normalizeString(payload?.contract_version) ?? undefined,
    items,
    next_cursor: normalizeString(payload?.next_cursor),
  };
}

function normalizeCatalogItem(value: unknown): InteractionCatalogItem | null {
  const item = asRecord(value);
  const code = normalizeString(item?.code) ?? normalizeString(item?.name);
  if (!code) return null;

  return {
    name: normalizeString(item?.name) ?? undefined,
    code,
    display_name: normalizeString(item?.display_name),
    enabled: Boolean(item?.enabled),
    sort_order: typeof item?.sort_order === "number" ? item.sort_order : 0,
    description: normalizeString(item?.description),
  };
}

function normalizeImportance(value: unknown): IntentImportance {
  return value === "High" || value === "Very High" || value === "Medium"
    ? value
    : "Medium";
}

function normalizeInteractionType(value: unknown): InteractionType | null {
  const item = normalizeCatalogItem(value);
  if (!item) return null;
  return { ...item, sort_order: item.sort_order ?? 0 };
}

function normalizeIntentType(value: unknown): IntentType | null {
  const item = normalizeCatalogItem(value);
  if (!item) return null;
  const rawItem = asRecord(value);
  return {
    ...item,
    importance: normalizeImportance(rawItem?.importance),
    sort_order: item.sort_order ?? 0,
  };
}

function normalizeCatalog<T extends InteractionCatalogItem>(
  value: unknown,
  normalizeItem: (value: unknown) => T | null,
): T[] {
  const payload = unwrapMessage(value);
  if (!Array.isArray(payload)) return [];
  return payload
    .map(normalizeItem)
    .filter((item): item is T => item !== null)
    .filter((item) => item.enabled)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

function assertSingleTarget(target: InteractionTarget): void {
  const hasStudent = Boolean(target.student?.trim());
  const hasContact = Boolean(target.contact?.trim());
  if (hasStudent === hasContact) {
    throw new InteractionIntelligenceApiError(
      400,
      "INVALID_INTERACTION_TARGET",
      "Cần truyền đúng một trong student hoặc contact.",
    );
  }
}

export async function listInteractions(
  target: InteractionTarget,
  filters: InteractionFeedFilters = {},
  options: InteractionRequestOptions = {},
): Promise<InteractionFeedResponse> {
  assertSingleTarget(target);

  const params: Record<string, string> = {
    ...(target.student ? { student: target.student.trim() } : {}),
    ...(target.contact ? { contact: target.contact.trim() } : {}),
    limit: String(Math.min(Math.max(Math.floor(filters.limit ?? 20), 1), 100)),
  };

  for (const key of [
    "channel",
    "direction",
    "status",
    "family",
    "search",
    "interaction_type",
    "outcome",
    "source_type",
    "source_id",
    "from_date",
    "to_date",
    "cursor",
  ] as const) {
    const value = filters[key];
    if (typeof value === "string" && value.trim()) params[key] = value.trim();
  }

  return normalizeFeed(await callFrappeRpc(METHODS.LIST, params, options));
}

export async function getInteractionDetail(
  interaction: string,
  options: InteractionRequestOptions = {},
): Promise<InteractionDetailResponse> {
  const id = interaction.trim();
  if (!id) {
    throw new InteractionIntelligenceApiError(
      400,
      "INVALID_INTERACTION_ID",
      "Thiếu mã tương tác.",
    );
  }

  const raw = await callFrappeRpc<unknown>(
    METHODS.DETAIL,
    { interaction: id },
    options,
  );
  const payload = asRecord(raw);
  const summary = normalizeSummary(payload?.interaction);
  if (!summary) {
    throw new InteractionIntelligenceApiError(
      502,
      "INVALID_INTERACTION_DETAIL_RESPONSE",
      "Phản hồi chi tiết tương tác không hợp lệ.",
    );
  }

  return {
    contract_version: normalizeString(payload?.contract_version) ?? undefined,
    interaction: summary,
    revision:
      (asRecord(payload?.revision) as InteractionDetailResponse["revision"]) ??
      null,
    analysis:
      (asRecord(payload?.analysis) as InteractionDetailResponse["analysis"]) ??
      null,
    intents: Array.isArray(payload?.intents)
      ? (payload.intents as InteractionDetailResponse["intents"])
      : [],
    score_effects: Array.isArray(payload?.score_effects)
      ? (payload.score_effects as InteractionDetailResponse["score_effects"])
      : [],
    evidence_ref: normalizeString(payload?.evidence_ref),
    evidence_refs: Array.isArray(payload?.evidence_refs)
      ? (payload.evidence_refs as InteractionDetailResponse["evidence_refs"])
      : [],
  };
}

export async function getInteractionEvidence(
  evidence: string,
  includeContent = false,
  options: InteractionRequestOptions = {},
): Promise<InteractionEvidence> {
  const id = evidence.trim();
  if (!id) {
    throw new InteractionIntelligenceApiError(
      400,
      "INVALID_EVIDENCE_ID",
      "Thiếu mã evidence.",
    );
  }

  const raw = await callFrappeRpc<unknown>(
    METHODS.EVIDENCE,
    { evidence: id, include_content: includeContent ? "1" : "0" },
    options,
  );
  const payload = asRecord(raw);
  if (!normalizeString(payload?.id)) {
    throw new InteractionIntelligenceApiError(
      502,
      "INVALID_INTERACTION_EVIDENCE_RESPONSE",
      "Phản hồi evidence không hợp lệ.",
    );
  }

  return payload as unknown as InteractionEvidence;
}

async function getCatalogItems<T extends InteractionCatalogItem>(
  doctype: "CRM Interaction Type" | "CRM Intent Type",
  normalizeItem: (value: unknown) => T | null,
  options: InteractionRequestOptions = {},
): Promise<T[]> {
  const raw = await callFrappeRpc<unknown>(
    METHODS.GET_LIST,
    {
      doctype,
      fields: JSON.stringify(INTERACTION_FIELDS),
      filters: JSON.stringify([["enabled", "=", 1]]),
      order_by: "sort_order asc",
      limit_page_length: "100",
    },
    options,
  );
  return normalizeCatalog(raw, normalizeItem);
}

export async function getInteractionCatalog(
  options: InteractionRequestOptions = {},
): Promise<InteractionCatalog> {
  const [interactionTypes, intentTypes] = await Promise.all([
    getCatalogItems("CRM Interaction Type", normalizeInteractionType, options),
    getCatalogItems("CRM Intent Type", normalizeIntentType, options),
  ]);

  return {
    interactionTypes,
    intentTypes,
  };
}
