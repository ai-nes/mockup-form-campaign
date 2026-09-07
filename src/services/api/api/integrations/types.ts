export const INTEGRATION_TYPES = ["call", "zalo"] as const;

export type IntegrationType = (typeof INTEGRATION_TYPES)[number];

export type IntegrationStatus = "enabled" | "disabled" | "not_configured";

export interface IntegrationItem {
  type: IntegrationType;
  provider: string;
  label: string;
  enabled: boolean;
  status: IntegrationStatus;
}

export interface IntegrationsMeta {
  requestedType: IntegrationType | null;
  returnedTypes: IntegrationType[];
  total: number;
}

export interface IntegrationsResponse {
  data: IntegrationItem[];
  meta: IntegrationsMeta;
}

export interface GetIntegrationsParams {
  type?: IntegrationType;
}
