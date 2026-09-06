import http from '../common/http';

const BASE = '/api/payruns';

export const getPayruns = (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  const queryString = query.toString();
  return http.get(queryString ? `${BASE}?${queryString}` : BASE);
};

export const createPayrunBatch = (data) => http.post(BASE, data);
export const getPayrunById = (id) => http.get(`${BASE}/${id}`);
export const getPayslipById = (id) => http.get(`${BASE}/payslips/${id}`);
export const updatePayrunState = (id, state) => http.put(`${BASE}/${id}/state`, { state });
export const updatePayslipsStatus = (payslipIds, state = 'Paid') => http.put(`${BASE}/payslips/status`, { payslipIds, state });
export const deletePayrun = (id) => http.del(`${BASE}/${id}`);
