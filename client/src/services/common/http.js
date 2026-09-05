
import { API_BASE_URL } from './apiConfig';


const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const token = localStorage.getItem('peopleos_token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const rawUser = localStorage.getItem('peopleos_user');
  if (rawUser) {
    try {
      const user = JSON.parse(rawUser);
      if (user.id || user._id) {
        defaultHeaders['x-user-id'] = user.id || user._id;
      }
      if (user.role) {
        defaultHeaders['x-user-role'] = user.role;
      }
      if (user.employeeId) {
        defaultHeaders['x-employee-id'] = user.employeeId;
      }
    } catch {
      // Ignore JSON parsing errors
    }
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);


  let responseData;
  try {
    responseData = await response.json();
  } catch {
    responseData = null;
  }

  if (!response.ok) {

    const error = new Error(
      responseData?.message || `HTTP ${response.status}: ${response.statusText}`
    );
    error.status = response.status;
    error.data = responseData;
    throw error;
  }

  return responseData;
};


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
