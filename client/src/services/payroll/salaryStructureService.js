/**
 * PeopleOS — Salary Structure Service
 * Native fetch API wrapper
 */
import http from '../common/http';

const BASE = '/api/salary-structures';

export const getSalaryStructures = () => http.get(BASE);
export const getSalaryStructureById = (id) => http.get(`${BASE}/${id}`);
export const createSalaryStructure = (data) => http.post(BASE, data);
export const updateSalaryStructure = (id, data) => http.put(`${BASE}/${id}`, data);
export const deleteSalaryStructure = (id) => http.del(`${BASE}/${id}`);
