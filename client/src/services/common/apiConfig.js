/**
 * PeopleOS — API Base URL Configuration
 *
 * Read from Vite environment variable.
 * Fallback to localhost for development.
 *
 * Set VITE_API_BASE_URL in your .env file to override.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
