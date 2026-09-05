/**
 * PeopleOS — Native fetch() HTTP Utility
 *
 * Provides GET, POST, PUT, DELETE wrappers using native fetch().
 * DO NOT replace with Axios or any other HTTP client.
 *
 * All service files must import from this module for API calls.
 */

import { API_BASE_URL } from './apiConfig';

/**
 * Core request function.
 * @param {string} endpoint - API path, e.g. '/api/employees'
 * @param {RequestInit} options - fetch options (method, body, headers, etc.)
 * @returns {Promise<{ success: boolean, data?: *, message?: string }>}
 */
const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // Attach auth token if present (Member 1 will set localStorage key)
  const token = localStorage.getItem('peopleos_token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  // Serialize body if provided as object
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);

  // Parse JSON body (even for error responses)
  let responseData;
  try {
    responseData = await response.json();
  } catch {
    // Non-JSON response (e.g. empty 204)
    responseData = null;
  }

  if (!response.ok) {
    // Throw an error object that matches the backend envelope
    const error = new Error(
      responseData?.message || `HTTP ${response.status}: ${response.statusText}`
    );
    error.status = response.status;
    error.data = responseData;
    throw error;
  }

  return responseData;
};

// ─────────────────────────────────────────────
// Public HTTP methods
// ─────────────────────────────────────────────

export const get = (endpoint, options = {}) =>
  request(endpoint, { method: 'GET', ...options });

export const post = (endpoint, body, options = {}) =>
  request(endpoint, { method: 'POST', body, ...options });

export const put = (endpoint, body, options = {}) =>
  request(endpoint, { method: 'PUT', body, ...options });

export const del = (endpoint, options = {}) =>
  request(endpoint, { method: 'DELETE', ...options });

const http = { get, post, put, del };
export default http;
