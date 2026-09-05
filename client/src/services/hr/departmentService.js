/**
 * PeopleOS — Department Service
 * Member 2 (HR Frontend) — API communication only, no business logic.
 */
import http from '../common/http';

const BASE = '/api/departments';

export const getDepartments = () => http.get(BASE);
export const getDepartmentById = (id) => http.get(`${BASE}/${id}`);
export const createDepartment = (data) => http.post(BASE, data);
export const updateDepartment = (id, data) => http.put(`${BASE}/${id}`, data);
export const deleteDepartment = (id) => http.del(`${BASE}/${id}`);
