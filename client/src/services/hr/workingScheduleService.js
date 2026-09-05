/**
 * PeopleOS — Working Schedule Service
 * Member 2 (HR Frontend) — API communication only, no business logic.
 */
import http from '../common/http';

const BASE = '/api/working-schedules';

export const getWorkingSchedules = () => http.get(BASE);
export const getWorkingScheduleById = (id) => http.get(`${BASE}/${id}`);
export const createWorkingSchedule = (data) => http.post(BASE, data);
export const updateWorkingSchedule = (id, data) => http.put(`${BASE}/${id}`, data);
export const deleteWorkingSchedule = (id) => http.del(`${BASE}/${id}`);
