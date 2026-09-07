export type CRMNoteReferenceDoctype = "CRM Lead" | "CRM Student";

export interface CRMNote {
  name: string;
  content: string;
  referenceDoctype: CRMNoteReferenceDoctype;
  referenceDocname: string;
  modified?: string;
  creation?: string;
  owner?: string;
  ownerFullName?: string;
  modifiedBy?: string;
}

export interface ListNotesParams {
  referenceDoctype: CRMNoteReferenceDoctype;
  referenceDocname: string;
  search?: string;
  start?: number;
  pageLength?: number;
}

export interface ListNotesResponse {
  total: number;
  start: number;
  pageLength: number;
  notes: CRMNote[];
}

export interface CreateNotePayload {
  referenceDoctype: CRMNoteReferenceDoctype;
  referenceDocname: string;
  content?: string;
}

export interface UpdateNotePayload {
  name: string;
  content?: string;
}

export interface DeleteNotePayload {
  name: string;
}
