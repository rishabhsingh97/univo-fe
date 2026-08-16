import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { PlatformLayout } from '../components/layout/PlatformLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { PlatformProtectedRoute } from './PlatformProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { PlatformLoginPage } from '../pages/PlatformLoginPage';
import { PlatformClientsPage } from '../pages/PlatformClientsPage';
import { PlatformModulesPage } from '../pages/PlatformModulesPage';
import { DashboardPage } from '../pages/DashboardPage';
import { EmployeesPage } from '../pages/EmployeesPage';
import { OrgUnitsPage } from '../pages/OrgUnitsPage';
import { DesignationsPage } from '../pages/DesignationsPage';
import { GradesPage } from '../pages/GradesPage';
import { DepartmentsPage } from '../pages/DepartmentsPage';
import { LocationsPage } from '../pages/LocationsPage';
import { EmployeeDocumentsPage } from '../pages/EmployeeDocumentsPage';
import { AttendancePage } from '../pages/AttendancePage';
import { LeavePage } from '../pages/LeavePage';
import { HolidaysPage } from '../pages/HolidaysPage';
import { PayrollPage } from '../pages/PayrollPage';
import { SalaryStructuresPage } from '../pages/SalaryStructuresPage';
import { FinancePage } from '../pages/FinancePage';
import { RolesPage } from '../pages/RolesPage';
import { UsersPage } from '../pages/UsersPage';
import { AuditLogPage } from '../pages/AuditLogPage';
import { SettingsConfigPage } from '../pages/SettingsConfigPage';
import { MyDetailsPage } from '../pages/MyDetailsPage';
import { BrandingPage } from '../pages/BrandingPage';
import { AccessManagementPage } from '../pages/AccessManagementPage';
import { FieldConfigPage } from '../pages/FieldConfigPage';
import { HelpCenterPage } from '../pages/HelpCenterPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/platform/login" element={<PlatformLoginPage />} />
      <Route element={<PlatformProtectedRoute />}>
        <Route element={<PlatformLayout />}>
          <Route path="/platform" element={<Navigate to="/platform/clients" replace />} />
          <Route path="/platform/clients" element={<PlatformClientsPage />} />
          <Route path="/platform/modules" element={<PlatformModulesPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/org-units" element={<OrgUnitsPage />} />
          <Route path="/designations" element={<DesignationsPage />} />
          <Route path="/grades" element={<GradesPage />} />
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/locations" element={<LocationsPage />} />
          <Route path="/employee-documents" element={<EmployeeDocumentsPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/leave" element={<LeavePage />} />
          <Route path="/holidays" element={<HolidaysPage />} />
          <Route path="/payroll" element={<PayrollPage />} />
          <Route path="/payroll/salary-structures" element={<SalaryStructuresPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/admin/roles" element={<RolesPage />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/audit-log" element={<AuditLogPage />} />
          <Route path="/settings/config" element={<SettingsConfigPage />} />
          <Route path="/my-details" element={<MyDetailsPage />} />
          <Route path="/settings/branding" element={<BrandingPage />} />
          <Route path="/settings/access" element={<AccessManagementPage />} />
          <Route path="/settings/fields" element={<FieldConfigPage />} />
          <Route path="/help" element={<HelpCenterPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
