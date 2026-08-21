import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { PopupLayout } from '../components/layout/PopupLayout';
import { PlatformLayout } from '../components/layout/PlatformLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { PlatformProtectedRoute } from './PlatformProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { SignupStep1Page } from '../pages/signup/SignupStep1Page';
import { SignupStep2Page } from '../pages/signup/SignupStep2Page';
import { SignupStep3Page } from '../pages/signup/SignupStep3Page';
import { PlatformLoginPage } from '../pages/PlatformLoginPage';
import { PlatformClientsPage } from '../pages/PlatformClientsPage';
import { PlatformModulesPage } from '../pages/PlatformModulesPage';
import { PlatformStatusPage } from '../pages/PlatformStatusPage';
import { DashboardPage } from '../pages/DashboardPage';
import { EmployeesPage } from '../pages/EmployeesPage';
import { OrgUnitsPage } from '../pages/OrgUnitsPage';
import { DesignationsPage } from '../pages/DesignationsPage';
import { GradesPage } from '../pages/GradesPage';
import { LocationsPage } from '../pages/LocationsPage';
import { AttendancePage } from '../pages/AttendancePage';
import { LeavePage } from '../pages/LeavePage';
import { HolidaysPage } from '../pages/HolidaysPage';
import { ShiftsPage } from '../pages/ShiftsPage';
import { RosterPage } from '../pages/RosterPage';
import { AttendanceRegularizationPage } from '../pages/AttendanceRegularizationPage';
import { OvertimePage } from '../pages/OvertimePage';
import { JobRequisitionsPage } from '../pages/JobRequisitionsPage';
import { JobsPage } from '../pages/JobsPage';
import { CandidatesPage } from '../pages/CandidatesPage';
import { InterviewsPage } from '../pages/InterviewsPage';
import { OffersPage } from '../pages/OffersPage';
import { PayrollPage } from '../pages/PayrollPage';
import { SalaryStructuresPage } from '../pages/SalaryStructuresPage';
import { SalaryComponentsPage } from '../pages/SalaryComponentsPage';
import { FinancePage } from '../pages/FinancePage';
import { TaxConfigPage } from '../pages/TaxConfigPage';
import { StatutoryConfigPage } from '../pages/StatutoryConfigPage';
import { PerformancePage } from '../pages/PerformancePage';
import { CareerPage } from '../pages/CareerPage';
import { ExitPage } from '../pages/ExitPage';
import { FullFinalPage } from '../pages/FullFinalPage';
import { RetirementPage } from '../pages/RetirementPage';
import { SettingsConfigPage } from '../pages/SettingsConfigPage';
import { MyDetailsPage } from '../pages/MyDetailsPage';
import { ChangePasswordPage } from '../pages/ChangePasswordPage';
import { EmployeeDetailPage } from '../pages/EmployeeDetailPage';
import { AdministrationPage } from '../pages/AdministrationPage';
import { HelpCenterPage } from '../pages/HelpCenterPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupStep1Page />} />
      <Route path="/signup/:draftId/company" element={<SignupStep2Page />} />
      <Route path="/signup/:draftId/modules" element={<SignupStep3Page />} />
      <Route path="/platform/login" element={<PlatformLoginPage />} />
      <Route element={<PlatformProtectedRoute />}>
        <Route element={<PlatformLayout />}>
          <Route path="/platform" element={<Navigate to="/platform/clients" replace />} />
          <Route path="/platform/clients" element={<PlatformClientsPage />} />
          <Route path="/platform/modules" element={<PlatformModulesPage />} />
          <Route path="/platform/status" element={<PlatformStatusPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/employees/:id" element={<EmployeeDetailPage />} />
          <Route path="/org-units" element={<OrgUnitsPage />} />
          <Route path="/designations" element={<DesignationsPage />} />
          <Route path="/grades" element={<GradesPage />} />
          <Route path="/departments" element={<Navigate to="/org-units" replace />} />
          <Route path="/locations" element={<LocationsPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/leave" element={<LeavePage />} />
          <Route path="/holidays" element={<HolidaysPage />} />
          <Route path="/shifts" element={<ShiftsPage />} />
          <Route path="/roster" element={<RosterPage />} />
          <Route path="/attendance-regularization" element={<AttendanceRegularizationPage />} />
          <Route path="/overtime" element={<OvertimePage />} />
          <Route path="/recruitment/requisitions" element={<JobRequisitionsPage />} />
          <Route path="/recruitment/jobs" element={<JobsPage />} />
          <Route path="/recruitment/candidates" element={<CandidatesPage />} />
          <Route path="/recruitment/interviews" element={<InterviewsPage />} />
          <Route path="/recruitment/offers" element={<OffersPage />} />
          <Route path="/payroll" element={<PayrollPage />} />
          <Route path="/payroll/salary-structures" element={<SalaryStructuresPage />} />
          <Route path="/payroll/salary-components" element={<SalaryComponentsPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/finance/tax-config" element={<TaxConfigPage />} />
          <Route path="/finance/statutory-config" element={<StatutoryConfigPage />} />
          <Route path="/performance" element={<PerformancePage />} />
          <Route path="/career" element={<CareerPage />} />
          <Route path="/exit" element={<ExitPage />} />
          <Route path="/full-final" element={<FullFinalPage />} />
          <Route path="/retirement" element={<RetirementPage />} />
          {/* No sidebar entry of their own - reached from the topbar's gear/profile/help icons,
           * so they render as a big popup (PopupLayout) instead of a plain full-page route.
           * Administration folds its four sections (audit log, branding, access, fields) into
           * flat tabs inside AdministrationPage instead of separate routes/sidebar entries. */}
          <Route element={<PopupLayout />}>
            <Route path="/admin" element={<AdministrationPage />} />
            <Route path="/settings/config" element={<SettingsConfigPage />} />
            <Route path="/my-details" element={<MyDetailsPage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route path="/help" element={<HelpCenterPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
