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
