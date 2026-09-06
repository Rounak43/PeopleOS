/**
 * PeopleOS — Salary Rule Service
 * Native fetch API wrapper
 */
import http from '../common/http';

const BASE = '/api/salary-rules';

export const getSalaryRules = () => http.get(BASE);
export const getSalaryRuleById = (id) => http.get(`${BASE}/${id}`);
export const createSalaryRule = (data) => http.post(BASE, data);
export const updateSalaryRule = (id, data) => http.put(`${BASE}/${id}`, data);
export const deleteSalaryRule = (id) => http.del(`${BASE}/${id}`);
