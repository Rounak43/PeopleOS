/**
 * PeopleOS — Central Route Configuration
 *
 * HR routes   → Member 2
 * Payroll routes → Member 3
 * Auth routes → Member 1
 *
 * All routes are lazy-loaded for performance.
 */
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Loading from '../components/common/Loading';

// ── Auth ──────────────────────────────────────
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));

// ── HR Pages (Member 2) ───────────────────────
const EmployeesPage        = lazy(() => import('../pages/hr/employees/EmployeesPage'));
const DepartmentsPage      = lazy(() => import('../pages/hr/departments/DepartmentsPage'));
const JobPositionsPage     = lazy(() => import('../pages/hr/jobPositions/JobPositionsPage'));
const WorkingSchedulesPage = lazy(() => import('../pages/hr/workingSchedules/WorkingSchedulesPage'));
const ContractsPage        = lazy(() => import('../pages/hr/contracts/ContractsPage'));
const AttendancePage       = lazy(() => import('../pages/hr/attendance/AttendancePage'));
const TimeOffPage          = lazy(() => import('../pages/hr/timeOff/TimeOffPage'));

// ── Payroll Pages (Member 3) ──────────────────
const SalaryStructuresPage  = lazy(() => import('../pages/payroll/salaryStructures/SalaryStructuresPage'));
const SalaryRulesPage       = lazy(() => import('../pages/payroll/salaryRules/SalaryRulesPage'));
const PayrunsPage           = lazy(() => import('../pages/payroll/payruns/PayrunsPage'));
const PayslipsPage          = lazy(() => import('../pages/payroll/payslips/PayslipsPage'));
const PayrollDashboardPage  = lazy(() => import('../pages/payroll/dashboard/PayrollDashboardPage'));

const AppRoutes = () => {
  return (
    <Suspense fallback={<Loading message="Loading page..." />}>
      <Routes>
        {/* ── Public ── */}
        <Route path="/login" element={<LoginPage />} />

        {/* ── Authenticated — wrapped in AppLayout ── */}
        <Route element={<AppLayout />}>
          {/* Default redirect */}
          <Route index element={<Navigate to="/hr/employees" replace />} />

          {/* HR */}
          <Route path="/hr/employees"          element={<EmployeesPage />} />
          <Route path="/hr/departments"        element={<DepartmentsPage />} />
          <Route path="/hr/job-positions"      element={<JobPositionsPage />} />
          <Route path="/hr/working-schedules"  element={<WorkingSchedulesPage />} />
          <Route path="/hr/contracts"          element={<ContractsPage />} />
          <Route path="/hr/attendance"         element={<AttendancePage />} />
          <Route path="/hr/time-off"           element={<TimeOffPage />} />

          {/* Payroll */}
          <Route path="/payroll/salary-structures" element={<SalaryStructuresPage />} />
          <Route path="/payroll/salary-rules"      element={<SalaryRulesPage />} />
          <Route path="/payroll/payruns"           element={<PayrunsPage />} />
          <Route path="/payroll/payslips"          element={<PayslipsPage />} />
          <Route path="/payroll/dashboard"         element={<PayrollDashboardPage />} />

          {/* Catch-all inside layout */}
          <Route path="*" element={<Navigate to="/hr/employees" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
