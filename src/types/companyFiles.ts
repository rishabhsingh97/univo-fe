export type CompanyFileCategory = 'POLICY' | 'FORM' | 'TEMPLATE' | 'GENERAL';

export interface CompanyFileResponse {
  id: number;
  name: string;
  category: CompanyFileCategory;
  description: string | null;
  uploadedByName: string | null;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
}
