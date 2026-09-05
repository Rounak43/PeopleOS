/**
 * PeopleOS — Central Route Configuration
 * Supports both HR Management and Employee Portal self-service modules.
 */
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Loading from '../components/common/Loading';
import ProtectedRoute from '../components/common/ProtectedRoute';
import useAuth from '../hooks/useAuth';

// ── Auth ──────────────────────────────────────
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));

// ── Employee Portal Pages ─────────────────────
const EmployeeDashboardPage   = lazy(() => import('../pages/employee/dashboard/EmployeeDashboardPage'));
const EmployeeProfilePage     = lazy(() => import('../pages/employee/profile/EmployeeProfilePage'));
const EmployeeAttendancePage  = lazy(() => import('../pages/employee/attendance/EmployeeAttendancePage'));
const EmployeeLeavePage       = lazy(() => import('../pages/employee/leave/EmployeeLeavePage'));
const EmployeePayrollPage     = lazy(() => import('../pages/employee/payroll/EmployeePayrollPage'));
const EmployeeSettingsPage    = lazy(() => import('../pages/employee/settings/EmployeeSettingsPage'));

// ── HR Pages ──────────────────────────────────
const EmployeesPage        = lazy(() => import('../pages/hr/employees/EmployeesPage'));
const DepartmentsPage      = lazy(() => import('../pages/hr/departments/DepartmentsPage'));
const JobPositionsPage     = lazy(() => import('../pages/hr/jobPositions/JobPositionsPage'));
const WorkingSchedulesPage = lazy(() => import('../pages/hr/workingSchedules/WorkingSchedulesPage'));
const ContractsPage        = lazy(() => import('../pages/hr/contracts/ContractsPage'));
const AttendancePage       = lazy(() => import('../pages/hr/attendance/AttendancePage'));
const TimeOffPage          = lazy(() => import('../pages/hr/timeOff/TimeOffPage'));

const RootRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'employee') {
    return <Navigate to="/employee/dashboard" replace />;
  }
  return <Navigate to="/hr/employees" replace />;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<Loading message="Loading page..." />}>
      <Routes>
        {/* ── Public ── */}
        <Route path="/login" element={<LoginPage />} />

        {/* ── Protected Routes ── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* Dynamic root based on role */}
            <Route index element={<RootRedirect />} />

            {/* ── Employee Portal ── */}
            <Route path="/employee/dashboard"   element={<EmployeeDashboardPage />} />
            <Route path="/employee/profile"     element={<EmployeeProfilePage />} />
            <Route path="/employee/attendance"  element={<EmployeeAttendancePage />} />
            <Route path="/employee/leave"       element={<EmployeeLeavePage />} />
            <Route path="/employee/payroll"     element={<EmployeePayrollPage />} />
            <Route path="/employee/settings"    element={<EmployeeSettingsPage />} />

            {/* ── HR Management (Admins & HR Managers) ── */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager']} />}>
              <Route path="/hr/employees"          element={<EmployeesPage />} />
              <Route path="/hr/departments"        element={<DepartmentsPage />} />
              <Route path="/hr/job-positions"      element={<JobPositionsPage />} />
              <Route path="/hr/working-schedules"  element={<WorkingSchedulesPage />} />
              <Route path="/hr/contracts"          element={<ContractsPage />} />
              <Route path="/hr/attendance"         element={<AttendancePage />} />
              <Route path="/hr/time-off"           element={<TimeOffPage />} />
            </Route>

            {/* Catch-all inside layout */}
            <Route path="*" element={<RootRedirect />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
