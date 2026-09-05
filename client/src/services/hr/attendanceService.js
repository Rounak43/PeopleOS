
import http from '../common/http';

const BASE = '/api/attendance';

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });
  const str = query.toString();
  return str ? `?${str}` : '';
};

export const getAttendance = (params = {}) => http.get(`${BASE}${buildQueryString(params)}`);
export const getAttendanceById = (id) => http.get(`${BASE}/${id}`);
export const createAttendance = (data) => http.post(BASE, data);
export const updateAttendance = (id, data) => http.put(`${BASE}/${id}`, data);
export const deleteAttendance = (id) => http.del(`${BASE}/${id}`);

export const checkIn = (data = {}) => http.post(`${BASE}/check-in`, data);
export const checkOut = (id) => http.post(`${BASE}/${id}/check-out`, {});
export const correctAttendance = (id, data) => http.post(`${BASE}/${id}/correction`, data);

export const getEmployeeAttendance = (employeeId, params = {}) =>
  http.get(`/api/employees/${employeeId}/attendance${buildQueryString(params)}`);

const attendanceService = {
  getAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  checkIn,
  checkOut,
  correctAttendance,
  getEmployeeAttendance,
};

export default attendanceService;

