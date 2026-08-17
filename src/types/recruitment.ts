import type { EmploymentType } from './hr';

export type RequisitionStatus = 'OPEN' | 'ON_HOLD' | 'CLOSED';

export interface JobRequisitionRequest {
  title: string;
  orgUnitId?: number | null;
  designationId?: number | null;
  openings?: number;
  status?: RequisitionStatus;
  description?: string | null;
}

export interface JobRequisitionResponse {
  id: number;
  title: string;
  orgUnitId: number | null;
  orgUnitName: string | null;
  designationId: number | null;
  designationTitle: string | null;
  openings: number;
  status: RequisitionStatus;
  description: string | null;
}

export type JobPostingStatus = 'OPEN' | 'CLOSED';

export interface JobPostingRequest {
  requisitionId?: number | null;
  title: string;
  locationId?: number | null;
  employmentType?: EmploymentType;
  description?: string | null;
  status?: JobPostingStatus;
}

export interface JobPostingResponse {
  id: number;
  requisitionId: number | null;
  requisitionTitle: string | null;
  title: string;
  locationId: number | null;
  locationName: string | null;
  employmentType: EmploymentType;
  description: string | null;
  status: JobPostingStatus;
}

export type CandidateStatus = 'APPLIED' | 'SCREENING' | 'INTERVIEWING' | 'OFFERED' | 'HIRED' | 'REJECTED';

export interface CandidateRequest {
  jobPostingId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  source?: string | null;
  resumeUrl?: string | null;
  status?: CandidateStatus;
}

export interface CandidateResponse {
  id: number;
  jobPostingId: number;
  jobPostingTitle: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  source: string | null;
  resumeUrl: string | null;
  status: CandidateStatus;
}

export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
export type InterviewOutcome = 'PENDING' | 'PASS' | 'FAIL';

export interface InterviewRequest {
  candidateId: number;
  interviewerId?: number | null;
  round: string;
  scheduledAt: string;
  status?: InterviewStatus;
  outcome?: InterviewOutcome;
  feedback?: string | null;
}

export interface InterviewResponse {
  id: number;
  candidateId: number;
  candidateName: string;
  interviewerId: number | null;
  interviewerName: string | null;
  round: string;
  scheduledAt: string;
  status: InterviewStatus;
  outcome: InterviewOutcome;
  feedback: string | null;
}

export type OfferStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN';

export interface OfferRequest {
  candidateId: number;
  offeredSalary: number;
  joiningDate: string;
  expiryDate?: string | null;
  status?: OfferStatus;
}

export interface OfferResponse {
  id: number;
  candidateId: number;
  candidateName: string;
  offeredSalary: number;
  joiningDate: string;
  expiryDate: string | null;
  status: OfferStatus;
}
