export interface HolidayRequest {
  name: string;
  holidayDate: string;
  recurringYearly: boolean;
}

export interface HolidayResponse {
  id: number;
  name: string;
  holidayDate: string;
  recurringYearly: boolean;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE';

export interface AttendanceRequest {
  employeeId: number;
  attendanceDate: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface AttendanceResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  attendanceDate: string;
  status: AttendanceStatus;
  remarks: string | null;
}

export interface AttendanceTodaySummary {
  date: string;
  presentCount: number;
  totalEmployees: number;
}

export type LeaveType = 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveApplicationRequest {
  employeeId: number;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface LeaveApplicationResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: LeaveStatus;
}

export interface LeaveStatusUpdateRequest {
  status: LeaveStatus;
}

export interface LeavePendingCount {
  count: number;
}

export interface ShiftRequest {
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  graceMinutes?: number;
}

export interface ShiftResponse {
  id: number;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  graceMinutes: number;
}

export interface ShiftAssignmentRequest {
  employeeId: number;
  shiftId: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

export interface ShiftAssignmentResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  shiftId: number;
  shiftName: string;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ApprovalStatusUpdateRequest {
  status: ApprovalStatus;
}

export interface AttendanceRegularizationRequest {
  employeeId: number;
  attendanceDate: string;
  requestedStatus: AttendanceStatus;
  reason?: string;
}

export interface AttendanceRegularizationResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  attendanceDate: string;
  requestedStatus: AttendanceStatus;
  reason: string | null;
  status: ApprovalStatus;
}

export interface OvertimeRequest {
  employeeId: number;
  workDate: string;
  hours: number;
  reason?: string;
}

export interface OvertimeResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  workDate: string;
  hours: number;
  reason: string | null;
  status: ApprovalStatus;
}
