export type LetterType = 'OFFER' | 'EXPERIENCE' | 'SALARY_CERTIFICATE' | 'RELIEVING' | 'CONFIRMATION';

export interface GenerateLetterRequest {
  employeeId: number;
  letterType: LetterType;
}

export interface GeneratedLetterResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  letterType: LetterType;
  content: string;
  generatedByName: string | null;
  generatedOn: string;
}
