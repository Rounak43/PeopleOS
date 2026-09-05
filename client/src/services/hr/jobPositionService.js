/**
 * PeopleOS — Job Position Service
 * Member 2 (HR Frontend) — API communication only, no business logic.
 */
import http from '../common/http';

const BASE = '/api/job-positions';

export const getJobPositions = () => http.get(BASE);
export const getJobPositionById = (id) => http.get(`${BASE}/${id}`);
export const createJobPosition = (data) => http.post(BASE, data);
export const updateJobPosition = (id, data) => http.put(`${BASE}/${id}`, data);
export const deleteJobPosition = (id) => http.del(`${BASE}/${id}`);
