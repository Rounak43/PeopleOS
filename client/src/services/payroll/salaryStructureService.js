/**
 * PeopleOS — Salary Structure Service
 * Member 3 (Payroll Frontend) — API communication only.
 */
import http from '../common/http';

const BASE = '/api/salary-structures';

export const getSalaryStructures = () => http.get(BASE);
export const getSalaryStructureById = (id) => http.get(`${BASE}/${id}`);
export const createSalaryStructure = (data) => http.post(BASE, data);
export const updateSalaryStructure = (id, data) => http.put(`${BASE}/${id}`, data);
export const deleteSalaryStructure = (id) => http.del(`${BASE}/${id}`);
