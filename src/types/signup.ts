/** Mirrors the backend's 3-step signup wizard (com.univo.platform.dto.SignupStep*Request) -
 * each step's PUT/POST persists to signup_drafts immediately, so a reload mid-signup doesn't
 * lose progress. */

export interface SignupStep1Request {
  fullName: string;
  email: string;
  password: string;
}

export interface SignupStep2Request {
  companyName: string;
  industry: string;
}

/** Only "hrms" is a real, provisioned module today - everything else here is just an interest
 * signal captured for later outreach (see ProductData in univo-landing for the same roadmap
 * framing on the marketing site). */
export interface SignupStep3Request {
  modulesInterested: string[];
}

export interface SignupDraftResponse {
  draftId: number;
  step: number;
  fullName: string | null;
  email: string | null;
  companyName: string | null;
  industry: string | null;
  tenantCode: string | null;
  modulesInterested: string[];
}
