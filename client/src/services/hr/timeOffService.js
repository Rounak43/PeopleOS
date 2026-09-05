
import http from '../common/http';

const TYPES = '/api/time-off/types';
const ALLOCATIONS = '/api/time-off/allocations';
const REQUESTS = '/api/time-off/requests';

// ── Types ──────────────────────────────────────
export const getTimeOffTypes = () => http.get(TYPES);
export const createTimeOffType = (data) => http.post(TYPES, data);
export const updateTimeOffType = (id, data) => http.put(`${TYPES}/${id}`, data);
export const deleteTimeOffType = (id) => http.del(`${TYPES}/${id}`);

// ── Allocations ────────────────────────────────
export const getAllocations = () => http.get(ALLOCATIONS);
export const createAllocation = (data) => http.post(ALLOCATIONS, data);
export const updateAllocation = (id, data) => http.put(`${ALLOCATIONS}/${id}`, data);
export const deleteAllocation = (id) => http.del(`${ALLOCATIONS}/${id}`);

// ── Requests ───────────────────────────────────
export const getRequests = () => http.get(REQUESTS);
export const getRequestById = (id) => http.get(`${REQUESTS}/${id}`);
export const createRequest = (data) => http.post(REQUESTS, data);
export const updateRequest = (id, data) => http.put(`${REQUESTS}/${id}`, data);
export const deleteRequest = (id) => http.del(`${REQUESTS}/${id}`);
export const approveRequest = (id) => http.post(`${REQUESTS}/${id}/approve`, {});
export const rejectRequest = (id) => http.post(`${REQUESTS}/${id}/reject`, {});
