/**
 * PeopleOS — Payroll Dashboard Service
 * Member 3 (Payroll Frontend) — API communication only.
 * Dashboard aggregation belongs to the backend.
 */
import http from '../common/http';

export const getPayrollDashboard = () => http.get('/api/dashboard/payroll');
