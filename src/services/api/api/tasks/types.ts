import type { StudentTaskItem } from "@/services/api/api/students/types";

export interface TaskManagementItem extends StudentTaskItem {
  studentId: string;
  studentName: string;
  studentCode: string;
  studentInitials: string;
  studentMajor: string;
}
