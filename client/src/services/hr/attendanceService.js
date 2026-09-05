/**
 * PeopleOS — Attendance Service
 * Member 2 (HR Frontend) — API communication only, no business logic.
 * Hours calculation belongs to the backend.
 */
import http from '../common/http';

const BASE = '/api/attendance';

export const getAttendance = () => http.get(BASE);
export const getAttendanceById = (id) => http.get(`${BASE}/${id}`);
export const createAttendance = (data) => http.post(BASE, data);
export const updateAttendance = (id, data) => http.put(`${BASE}/${id}`, data);
export const deleteAttendance = (id) => http.del(`${BASE}/${id}`);
export const checkIn = (data) => http.post(`${BASE}/check-in`, data);
export const checkOut = (data) => http.post(`${BASE}/check-out`, data);
