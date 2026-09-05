/**
 * PeopleOS — Central Route Configuration
 * HR routes management.
 */
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Loading from '../components/common/Loading';

// ── Auth ──────────────────────────────────────
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));

// ── HR Pages ───────────────────────
const EmployeesPage        = lazy(() => import('../pages/hr/employees/EmployeesPage'));
const DepartmentsPage      = lazy(() => import('../pages/hr/departments/DepartmentsPage'));
const JobPositionsPage     = lazy(() => import('../pages/hr/jobPositions/JobPositionsPage'));
const WorkingSchedulesPage = lazy(() => import('../pages/hr/workingSchedules/WorkingSchedulesPage'));
const ContractsPage        = lazy(() => import('../pages/hr/contracts/ContractsPage'));
const AttendancePage       = lazy(() => import('../pages/hr/attendance/AttendancePage'));
const TimeOffPage          = lazy(() => import('../pages/hr/timeOff/TimeOffPage'));

const AppRoutes = () => {
  return (
    <Suspense fallback={<Loading message="Loading page..." />}>
      <Routes>
        {/* ── Public ── */}
        <Route path="/login" element={<LoginPage />} />

        {/* ── Authenticated — wrapped in AppLayout ── */}
        <Route element={<AppLayout />}>
          {/* Default redirect to Login */}
          <Route index element={<Navigate to="/login" replace />} />

          {/* HR */}
          <Route path="/hr/employees"          element={<EmployeesPage />} />
          <Route path="/hr/departments"        element={<DepartmentsPage />} />
          <Route path="/hr/job-positions"      element={<JobPositionsPage />} />
          <Route path="/hr/working-schedules"  element={<WorkingSchedulesPage />} />
          <Route path="/hr/contracts"          element={<ContractsPage />} />
          <Route path="/hr/attendance"         element={<AttendancePage />} />
          <Route path="/hr/time-off"           element={<TimeOffPage />} />

          {/* Catch-all inside layout */}
          <Route path="*" element={<Navigate to="/hr/employees" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
