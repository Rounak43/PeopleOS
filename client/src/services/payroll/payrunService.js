/**
 * PeopleOS — Payrun Service
 * Member 3 (Payroll Frontend) — API communication only.
 * All payroll calculations (gross, net, deductions) belong to the backend.
 */
import http from '../common/http';

const BASE = '/api/payruns';

export const getPayruns = () => http.get(BASE);
export const getPayrunById = (id) => http.get(`${BASE}/${id}`);
export const previewPayrun = (data) => http.post(`${BASE}/preview`, data);
export const createPayrun = (data) => http.post(BASE, data);
export const updatePayrun = (id, data) => http.put(`${BASE}/${id}`, data);
export const deletePayrun = (id) => http.del(`${BASE}/${id}`);

export const computePayrun = (id) => http.post(`${BASE}/${id}/compute`, {});
export const validatePayrun = (id) => http.post(`${BASE}/${id}/validate`, {});
export const markPayrunPaid = (id) => http.post(`${BASE}/${id}/mark-paid`, {});
export const sendPayslips = (id) => http.post(`${BASE}/${id}/send-payslips`, {});
