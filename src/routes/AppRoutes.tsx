import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { EmployeesPage } from '../pages/EmployeesPage';
import { OrgUnitsPage } from '../pages/OrgUnitsPage';
import { AttendancePage } from '../pages/AttendancePage';
import { LeavePage } from '../pages/LeavePage';
import { HolidaysPage } from '../pages/HolidaysPage';
import { PayrollPage } from '../pages/PayrollPage';
import { FinancePage } from '../pages/FinancePage';
import { RolesPage } from '../pages/RolesPage';
import { UsersPage } from '../pages/UsersPage';
import { AuditLogPage } from '../pages/AuditLogPage';
import { SettingsConfigPage } from '../pages/SettingsConfigPage';
import { BrandingPage } from '../pages/BrandingPage';
import { AccessManagementPage } from '../pages/AccessManagementPage';
import { FieldConfigPage } from '../pages/FieldConfigPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/org-units" element={<OrgUnitsPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/leave" element={<LeavePage />} />
          <Route path="/holidays" element={<HolidaysPage />} />
          <Route path="/payroll" element={<PayrollPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/admin/roles" element={<RolesPage />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/audit-log" element={<AuditLogPage />} />
          <Route path="/settings/config" element={<SettingsConfigPage />} />
          <Route path="/settings/branding" element={<BrandingPage />} />
          <Route path="/settings/access" element={<AccessManagementPage />} />
          <Route path="/settings/fields" element={<FieldConfigPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
