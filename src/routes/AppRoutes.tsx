import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { PopupLayout } from '../components/layout/PopupLayout';
import { PlatformLayout } from '../components/layout/PlatformLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { PlatformProtectedRoute } from './PlatformProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { SetPasswordPage } from '../pages/SetPasswordPage';
import { GoogleAuthBridgePage } from '../pages/GoogleAuthBridgePage';
import { SignupStep1Page } from '../pages/signup/SignupStep1Page';
import { SignupStep2Page } from '../pages/signup/SignupStep2Page';
import { SignupStep3Page } from '../pages/signup/SignupStep3Page';
import { PlatformLoginPage } from '../pages/PlatformLoginPage';
import { PlatformClientsPage } from '../pages/PlatformClientsPage';
import { PlatformModulesPage } from '../pages/PlatformModulesPage';
import { PlatformStatusPage } from '../pages/PlatformStatusPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ApprovalsPage } from '../pages/ApprovalsPage';
import { FilesPage } from '../pages/FilesPage';
import { HrLettersPage } from '../pages/HrLettersPage';
import { TravelPage } from '../pages/TravelPage';
import { TasksPage } from '../pages/TasksPage';
import { OnboardingPage } from '../pages/OnboardingPage';
import { ReferralsPage } from '../pages/ReferralsPage';
import { ServicesPage } from '../pages/ServicesPage';
import { TimeTrackerPage } from '../pages/TimeTrackerPage';
import { FeedPage } from '../pages/FeedPage';
import { AnnouncementsPage } from '../pages/AnnouncementsPage';
import { PollsPage } from '../pages/PollsPage';
import { InboxPage } from '../pages/InboxPage';
import { EmployeesPage } from '../pages/EmployeesPage';
import { OrgUnitsPage } from '../pages/OrgUnitsPage';
import { JobClassificationPage } from '../pages/JobClassificationPage';
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
import { GoalsPage } from '../pages/GoalsPage';
import { AppraisalsPage } from '../pages/AppraisalsPage';
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
import { NotFoundPage } from '../pages/NotFoundPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/set-password" element={<SetPasswordPage />} />
      <Route path="/google-bridge" element={<GoogleAuthBridgePage />} />
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
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/travel" element={<TravelPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/referrals" element={<ReferralsPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/time-tracker" element={<TimeTrackerPage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/polls" element={<PollsPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/hr-letters" element={<HrLettersPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/employees/:id" element={<EmployeeDetailPage />} />
          <Route path="/org-units" element={<OrgUnitsPage />} />
          <Route path="/job-classification" element={<JobClassificationPage />} />
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
          <Route path="/performance/goals" element={<GoalsPage />} />
          <Route path="/performance/appraisals" element={<AppraisalsPage />} />
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
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
