
import http from '../common/http';

const BASE = '/api/contracts';

export const getContracts = (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  if (params.search) query.append('search', params.search);
  if (params.status) query.append('status', params.status);
  if (params.durationType) query.append('durationType', params.durationType);
  if (params.employeeId) query.append('employeeId', params.employeeId);
  const queryString = query.toString();
  return http.get(queryString ? `${BASE}?${queryString}` : BASE);
};
export const getContractById = (id) => http.get(`${BASE}/${id}`);
export const createContract = (data) => http.post(BASE, data);
export const updateContract = (id, data) => http.put(`${BASE}/${id}`, data);
export const deleteContract = (id) => http.del(`${BASE}/${id}`);
