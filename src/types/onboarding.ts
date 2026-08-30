export type OnboardingTaskCategory = 'DOCUMENTATION' | 'ASSET' | 'POLICY' | 'ORIENTATION' | 'OTHER';
export type OnboardingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface OnboardingTaskResponse {
  id: number;
  title: string;
  category: OnboardingTaskCategory;
  done: boolean;
}

export interface OnboardingRecordRequest {
  employeeId: number;
  buddyEmployeeId?: number | null;
}

export interface OnboardingRecordResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  designationTitle: string | null;
  joiningDate: string;
  buddyEmployeeId: number | null;
  buddyName: string | null;
  status: OnboardingStatus;
  tasks: OnboardingTaskResponse[];
}

export interface OnboardingTaskRequest {
  title: string;
}
