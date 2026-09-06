/**
 * PeopleOS — Payrun & Payslip Frontend API Service
 * Native fetch via http.js utility.
 * Backend is single source of truth.
 */
import http from '../common/http';

const BASE = '/api/payruns';

export const getPayruns = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return http.get(`${BASE}${query ? `?${query}` : ''}`);
};

export const getPayrunById = (id) => http.get(`${BASE}/${id}`);
export const createPayrun = (data) => http.post(BASE, data);
export const computePayrun = (id) => http.post(`${BASE}/${id}/compute`, {});
export const validatePayrun = (id) => http.post(`${BASE}/${id}/validate`, {});
export const markPayrunPaid = (id) => http.post(`${BASE}/${id}/mark-paid`, {});
export const deletePayrun = (id) => http.del(`${BASE}/${id}`);

// Payslips (HR view)
export const getAllPayslips = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return http.get(`${BASE}/all-payslips${query ? `?${query}` : ''}`);
};
export const getPayslipById = (id) => http.get(`${BASE}/payslips/${id}`);

// Employee Self Service
export const getMyPayslips = () => http.get(`${BASE}/employee/my-payslips`);
export const getMyPayslipById = (id) => http.get(`${BASE}/employee/payslips/${id}`);
