
import http from '../common/http';

const BASE = '/api/employees';

export const getEmployees = (params = {}) => {
  const cleanParams = {};
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      cleanParams[key] = params[key];
    }
  });
  const query = new URLSearchParams(cleanParams).toString();
  return http.get(query ? `${BASE}?${query}` : BASE);
};
export const getEmployeeById = (id) => http.get(`${BASE}/${id}`);
export const createEmployee = (data) => http.post(BASE, data);
export const updateEmployee = (id, data) => http.put(`${BASE}/${id}`, data);
export const deleteEmployee = (id) => http.del(`${BASE}/${id}`);
