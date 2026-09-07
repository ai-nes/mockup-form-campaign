export const ACTION_TIME_SLOTS = [
  "0-6",
  "6-12",
  "12-18",
  "18-24",
] as const;

export type ActionTimeSlot = (typeof ACTION_TIME_SLOTS)[number];

export type ActionChannel = "NONE" | "CALL" | "EMAIL" | "MESSAGE";
export type ActionExecutionType = "MANUAL" | "AI_ASSISTED";

export interface NbaAction {
  name: string;
  code: string;
  displayName: string;
  actionType: string | null;
  description: string | null;
  purpose: string | null;
  defaultChannel: ActionChannel | null;
  allowedActors: string[];
  allowedTimeSlots: ActionTimeSlot[];
  requiresApproval: boolean;
  autoExecute: boolean;
  executionType: ActionExecutionType;
  aiAllowed: boolean;
  enabled: boolean;
  sortOrder: number;
  modified: string | null;
}

export interface NbaActionType {
  name: string;
  actionType: string;
  displayName: string;
  enabled: boolean;
}

export interface ListNbaActionsParams {
  actionType?: string;
  channel?: string;
  enabled?: boolean;
  search?: string;
  start?: number;
  pageLength?: number;
}

export interface ListNbaActionsResponse {
  total: number;
  start: number;
  pageLength: number;
  actions: NbaAction[];
}

export interface ListNbaActionTypesResponse {
  total: number;
  start: number;
  pageLength: number;
  actionTypes: NbaActionType[];
}

export interface ListNbaTimeSlotsResponse {
  timeSlots: ActionTimeSlot[];
}

export interface UpdateNbaActionPayload {
  name: string;
  displayName?: string;
  actionType?: string;
  description?: string;
  purpose?: string;
  defaultChannel?: ActionChannel;
  allowedActors?: string[];
  allowedTimeSlots?: ActionTimeSlot[];
  requiresApproval?: boolean;
  autoExecute?: boolean;
  executionType?: ActionExecutionType;
  aiAllowed?: boolean;
  enabled?: boolean;
  sortOrder?: number;
}

export interface CreateNbaActionPayload {
  code: string;
  displayName: string;
  actionType: string;
  description?: string;
  purpose?: string;
  defaultChannel: ActionChannel;
  allowedActors: string[];
  allowedTimeSlots: ActionTimeSlot[];
  requiresApproval: boolean;
  autoExecute: boolean;
  executionType: ActionExecutionType;
  aiAllowed: boolean;
  enabled: boolean;
  sortOrder: number;
}

export interface UpdateNbaActionResponse {
  name: string;
  action: NbaAction | null;
}
