export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditLogEntryResponse {
  id: number;
  entityName: string;
  entityId: string;
  action: AuditAction;
  performedBy: string;
  performedAt: string;
  details: string | null;
}

export interface UiFieldConfigRequest {
  entityName: string;
  fieldName: string;
  label: string;
  fieldType?: string;
  custom: boolean;
  /** Whether the field is visible at all. Omit/true = shown; false = hidden from the form. */
  enabled?: boolean;
  required: boolean;
  /** Visible but not editable. */
  readOnly: boolean;
  displayOrder: number;
}

export interface UiFieldConfigResponse {
  id: number;
  entityName: string;
  fieldName: string;
  label: string;
  fieldType: string;
  custom: boolean;
  enabled: boolean;
  required: boolean;
  readOnly: boolean;
  displayOrder: number;
}
