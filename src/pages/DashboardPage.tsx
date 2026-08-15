import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { useTimezone } from '../hooks/useTimezone';
import { employeeApi } from '../api/hr/employeeApi';
import { orgUnitApi } from '../api/hr/orgUnitApi';
import { attendanceApi } from '../api/attendance/attendanceApi';
import { leaveApi } from '../api/attendance/leaveApi';
import { holidayApi } from '../api/attendance/holidayApi';
import { Card, PageHeader, ApprovalActions } from '../components/ui';
import type { LeaveStatus } from '../types/attendance';
import { IconPeople, IconOrgUnits, IconClock, IconLeave, IconHoliday } from '../components/layout/navIcons';
import './dashboard.css';

const APPROVALS_PREVIEW_SIZE = 5;
const HOLIDAYS_PREVIEW_SIZE = 3;

export function DashboardPage() {
  const { session, hasPermission } = useAuth();
  const { t } = useLocale();
  const { formatDate } = useTimezone();
  const queryClient = useQueryClient();

  const canViewEmployees = hasPermission('hr.employee.read');
  const canViewOrgUnits = hasPermission('hr.orgunit.read');
  const canViewAttendance = hasPermission('attendance.read');
  const canViewLeave = hasPermission('leave.read');
  const canManageLeave = hasPermission('leave.write');
  const canViewHolidays = hasPermission('holiday.read');

  const headcountQuery = useQuery({
    queryKey: ['dashboard', 'headcount'],
    queryFn: () => employeeApi.list(0, 1),
    enabled: canViewEmployees,
  });

  const orgUnitsQuery = useQuery({
    queryKey: ['dashboard', 'org-units'],
    queryFn: () => orgUnitApi.list(0, 1),
    enabled: canViewOrgUnits,
  });

  const attendanceTodayQuery = useQuery({
    queryKey: ['dashboard', 'attendance-today'],
    queryFn: () => attendanceApi.todaySummary(),
    enabled: canViewAttendance,
  });

  const pendingLeaveCountQuery = useQuery({
    queryKey: ['dashboard', 'leave-pending-count'],
    queryFn: () => leaveApi.pendingCount(),
    enabled: canViewLeave,
  });

  const leavePreviewQuery = useQuery({
    queryKey: ['dashboard', 'leave-preview'],
    queryFn: () => leaveApi.list(0, 50),
    enabled: canViewLeave,
  });

  const holidaysQuery = useQuery({
    queryKey: ['dashboard', 'holidays'],
    queryFn: () => holidayApi.list(),
    enabled: canViewHolidays,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: LeaveStatus }) => leaveApi.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'leave-preview'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'leave-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['leave-applications'] });
    },
  });

  const pendingLeave = useMemo(
    () => (leavePreviewQuery.data?.content ?? []).filter((l) => l.status === 'PENDING').slice(0, APPROVALS_PREVIEW_SIZE),
    [leavePreviewQuery.data],
  );

  const upcomingHolidays = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (holidaysQuery.data ?? [])
      .filter((h) => h.holidayDate >= today)
      .sort((a, b) => a.holidayDate.localeCompare(b.holidayDate))
      .slice(0, HOLIDAYS_PREVIEW_SIZE);
  }, [holidaysQuery.data]);

  const attendancePercent = (() => {
    const summary = attendanceTodayQuery.data;
    if (!summary || summary.totalEmployees === 0) return null;
    return Math.round((summary.presentCount / summary.totalEmployees) * 100);
  })();

  const hasAnyKpi = canViewEmployees || canViewOrgUnits || canViewAttendance || canViewLeave;
  const today = new Date();
  const dateLabel = today.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div>
      <PageHeader title={t('pages.dashboard.title')} description={`${dateLabel} · Signed in as ${session?.username}`} />

      {!hasAnyKpi && (
        <Card>
          <p style={{ margin: 0 }}>Roles: {session?.roles.join(', ')}</p>
        </Card>
      )}

      {hasAnyKpi && (
        <div className="dash-kpis">
          {canViewEmployees && (
            <Card className="dash-kpi">
              <div className="dash-kpi-label">Headcount</div>
              <div className="dash-kpi-value">
                {headcountQuery.isLoading ? '—' : (headcountQuery.data?.totalElements ?? 0)}
              </div>
            </Card>
          )}
          {canViewOrgUnits && (
            <Card className="dash-kpi">
              <div className="dash-kpi-label">Org Units</div>
              <div className="dash-kpi-value">
                {orgUnitsQuery.isLoading ? '—' : (orgUnitsQuery.data?.totalElements ?? 0)}
              </div>
            </Card>
          )}
          {canViewAttendance && (
            <Card className="dash-kpi">
              <div className="dash-kpi-label">Attendance today</div>
              <div className="dash-kpi-value">
                {attendanceTodayQuery.isLoading ? '—' : attendancePercent === null ? '—' : `${attendancePercent}%`}
              </div>
              {attendanceTodayQuery.data && (
                <div className="dash-kpi-sub">
                  {attendanceTodayQuery.data.presentCount} of {attendanceTodayQuery.data.totalEmployees} present
                </div>
              )}
            </Card>
          )}
          {canViewLeave && (
            <Card className="dash-kpi">
              <div className="dash-kpi-label">Pending leave requests</div>
              <div className="dash-kpi-value">
                {pendingLeaveCountQuery.isLoading ? '—' : (pendingLeaveCountQuery.data?.count ?? 0)}
              </div>
            </Card>
          )}
        </div>
      )}

      {(canViewLeave || canViewHolidays) && (
        <div className="dash-body">
          {canViewLeave && (
            <Card className="dash-panel">
              <div className="dash-panel-head">
                <h2>Pending leave requests</h2>
              </div>
              {leavePreviewQuery.isLoading && <div className="dash-panel-empty">Loading…</div>}
              {!leavePreviewQuery.isLoading && pendingLeave.length === 0 && (
                <div className="dash-panel-empty">No pending leave requests.</div>
              )}
              {pendingLeave.map((leave) => (
                <div key={leave.id} className="dash-req-row">
                  <div className="dash-req-avatar">{leave.employeeName.slice(0, 2).toUpperCase()}</div>
                  <div className="dash-req-info">
                    <div className="dash-req-name">{leave.employeeName}</div>
                    <div className="dash-req-type">Leave · {leave.leaveType}</div>
                  </div>
                  <div className="dash-req-dates">
                    {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                  </div>
                  <ApprovalActions
                    status={leave.status}
                    canManage={canManageLeave}
                    onApprove={() => statusMutation.mutate({ id: leave.id, status: 'APPROVED' })}
                    onReject={() => statusMutation.mutate({ id: leave.id, status: 'REJECTED' })}
                  />
                </div>
              ))}
            </Card>
          )}

          <div className="dash-side-stack">
            <Card className="dash-panel">
              <div className="dash-panel-head">
                <h2>Quick links</h2>
              </div>
              <div className="dash-quick-links">
                {canViewEmployees && (
                  <Link className="dash-quick-link" to="/employees">
                    <IconPeople className="link-icon" />
                    Employees
                  </Link>
                )}
                {canViewAttendance && (
                  <Link className="dash-quick-link" to="/attendance">
                    <IconClock className="link-icon" />
                    Attendance
                  </Link>
                )}
                {canViewLeave && (
                  <Link className="dash-quick-link" to="/leave">
                    <IconLeave className="link-icon" />
                    Leave
                  </Link>
                )}
                {canViewOrgUnits && (
                  <Link className="dash-quick-link" to="/org-units">
                    <IconOrgUnits className="link-icon" />
                    Org Units
                  </Link>
                )}
              </div>
            </Card>

            {canViewHolidays && (
              <Card className="dash-panel">
                <div className="dash-panel-head">
                  <h2>Upcoming holidays</h2>
                </div>
                {holidaysQuery.isLoading && <div className="dash-panel-empty">Loading…</div>}
                {!holidaysQuery.isLoading && upcomingHolidays.length === 0 && (
                  <div className="dash-panel-empty">No upcoming holidays.</div>
                )}
                {upcomingHolidays.map((holiday) => (
                  <div key={holiday.id} className="dash-holiday-row">
                    <IconHoliday className="link-icon" />
                    <div>
                      <div className="dash-holiday-name">{holiday.name}</div>
                      <div className="dash-holiday-date">{formatDate(holiday.holidayDate)}</div>
                    </div>
                  </div>
                ))}
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
