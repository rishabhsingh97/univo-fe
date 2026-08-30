export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface TaskSubtaskResponse {
  id: number;
  label: string;
  done: boolean;
}

export interface TaskRequest {
  title: string;
  description?: string;
  assignedToEmployeeId: number;
  dueDate?: string | null;
  priority: TaskPriority;
}

export interface TaskResponse {
  id: number;
  title: string;
  description: string | null;
  assignedToEmployeeId: number;
  assignedToName: string;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  subtasks: TaskSubtaskResponse[];
}

export interface TaskStatusUpdateRequest {
  status: TaskStatus;
}

export interface TaskSubtaskRequest {
  label: string;
}
