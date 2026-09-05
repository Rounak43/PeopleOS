/**
 * PeopleOS — Employee Portal Service
 * API client encapsulation for all employee self-service endpoints.
 */

import http from '../common/http';

export const getDashboard = async () => {
  const res = await http.get('/api/employee/dashboard');
  return res.data || res;
};

export const getProfile = async () => {
  const res = await http.get('/api/employee/me');
  return res.data || res;
};

export const updateProfile = async (profileData) => {
  const res = await http.put('/api/employee/me', profileData);
  return res.data || res;
};

export const getTodayAttendance = async () => {
  const res = await http.get('/api/employee/attendance/today');
  return res.data || res;
};

export const checkIn = async () => {
  const res = await http.post('/api/employee/attendance/check-in', {});
  return res.data || res;
};

export const checkOut = async () => {
  const res = await http.post('/api/employee/attendance/check-out', {});
  return res.data || res;
};

export const requestReentry = async () => {
  const res = await http.post('/api/employee/attendance/re-entry', {});
  return res.data || res;
};

export const getAttendanceHistory = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.month) query.append('month', params.month);
  if (params.year) query.append('year', params.year);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const res = await http.get(`/api/employee/attendance${queryString}`);
  return res.data || res;
};

export const getLeaveOverview = async () => {
  const res = await http.get('/api/employee/leave');
  return res.data || res;
};

export const submitLeaveRequest = async (requestData) => {
  const res = await http.post('/api/employee/leave/requests', requestData);
  return res.data || res;
};

export const getPayslips = async () => {
  const res = await http.get('/api/employee/payslips');
  return res.data || res;
};

export const getPayslipById = async (id) => {
  const res = await http.get(`/api/employee/payslips/${id}`);
  return res.data || res;
};

const employeePortalService = {
  getDashboard,
  getProfile,
  updateProfile,
  getTodayAttendance,
  checkIn,
  checkOut,
  getAttendanceHistory,
  getLeaveOverview,
  submitLeaveRequest,
  getPayslips,
  getPayslipById,
};

export default employeePortalService;
