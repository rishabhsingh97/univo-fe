export interface TimeLogRequest {
  date: string;
  clockIn: string;
  clockOut: string;
  taskTag?: string;
}

export interface TimeLogResponse {
  id: number;
  date: string;
  clockIn: string;
  clockOut: string;
  durationMinutes: number;
  taskTag: string | null;
}
