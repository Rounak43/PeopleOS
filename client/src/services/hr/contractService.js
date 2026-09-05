
import http from '../common/http';

const BASE = '/api/contracts';

export const getContracts = () => http.get(BASE);
export const getContractById = (id) => http.get(`${BASE}/${id}`);
export const createContract = (data) => http.post(BASE, data);
export const updateContract = (id, data) => http.put(`${BASE}/${id}`, data);
export const deleteContract = (id) => http.del(`${BASE}/${id}`);
