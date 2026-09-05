
import http from '../common/http';

const BASE = '/api/employees';

export const getEmployees = () => http.get(BASE);
export const getEmployeeById = (id) => http.get(`${BASE}/${id}`);
export const createEmployee = (data) => http.post(BASE, data);
export const updateEmployee = (id, data) => http.put(`${BASE}/${id}`, data);
export const deleteEmployee = (id) => http.del(`${BASE}/${id}`);
