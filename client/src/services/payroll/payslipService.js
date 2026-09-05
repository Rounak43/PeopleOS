/**
 * PeopleOS — Payslip Service
 * Member 3 (Payroll Frontend) — API communication only.
 */
import http from '../common/http';

const BASE = '/api/payslips';

export const getPayslips = () => http.get(BASE);
export const getPayslipById = (id) => http.get(`${BASE}/${id}`);
export const getPayslipLines = (id) => http.get(`${BASE}/${id}/lines`);
export const getPayslipPdf = (id) => http.get(`${BASE}/${id}/pdf`);
