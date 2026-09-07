export type CRMTaskReferenceDoctype = "CRM Lead" | "CRM Student";
export type CRMTaskPriority = "Low" | "Medium" | "High";
export type CRMTaskStatus =
  | "Backlog"
  | "Todo"
  | "In Progress"
  | "Done"
  | "Canceled";

export interface CRMTask {
  name: string;
  title: string;
  description?: string;
  actionCode?: string;
  student?: string;
  linkedInteraction?: string;
  priority?: CRMTaskPriority;
  startDate?: string;
  assignedTo?: string;
  status?: CRMTaskStatus;
  dueDate?: string;
  referenceDoctype: CRMTaskReferenceDoctype;
  referenceDocname: string;
  owner?: string;
  creation?: string;
  modified?: string;
}

export interface ListTasksParams {
  /**
   * Optional for the management screen. When omitted, the backend must derive
   * the allowed own/team scope from the authenticated session.
   */
  referenceDoctype?: CRMTaskReferenceDoctype;
  referenceDocname?: string;
  search?: string;
  status?: CRMTaskStatus;
  start?: number;
  pageLength?: number;
}

export interface ListTasksResponse {
  total: number;
  start: number;
  pageLength: number;
  tasks: CRMTask[];
}

export interface CreateTaskPayload {
  referenceDoctype: CRMTaskReferenceDoctype;
  referenceDocname: string;
  title: string;
  description?: string;
  actionCode?: string;
  priority?: CRMTaskPriority;
  startDate?: string;
  assignedTo?: string;
  status?: CRMTaskStatus;
  dueDate?: string;
  linkedInteraction?: string;
}

export interface UpdateTaskPayload {
  name: string;
  title?: string;
  description?: string;
  priority?: CRMTaskPriority;
  startDate?: string;
  assignedTo?: string;
  status?: CRMTaskStatus;
  dueDate?: string;
  linkedInteraction?: string;
}

export interface DeleteTaskResponse {
  deleted: string;
}
