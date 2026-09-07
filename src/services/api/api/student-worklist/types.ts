export interface StudentWorklistItem {
  name: string;
  student: string | null;
  actionType: string | null;
  objective: string;
  state: string;
  executionStatus: string | null;
  priority: string;
  dueAt: string | null;
  actionOwner: string | null;
  origin: string | null;
  revision: number;
  isToday: boolean;
  isOverdue: boolean;
}

export interface StudentWorklistActionsResponse {
  items: StudentWorklistItem[];
}
