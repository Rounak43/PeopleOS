
import http from '../common/http';

const BASE = '/api/job-positions';

export const getJobPositions = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append('search', params.search);
  if (params.departmentId) queryParams.append('departmentId', params.departmentId);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);

  const queryString = queryParams.toString();
  const url = queryString ? `${BASE}?${queryString}` : BASE;
  return http.get(url);
};

export const getJobPositionById = (id) => http.get(`${BASE}/${id}`);
export const createJobPosition = (data) => http.post(BASE, data);
export const updateJobPosition = (id, data) => http.put(`${BASE}/${id}`, data);
export const deleteJobPosition = (id) => http.del(`${BASE}/${id}`);
