/**
 * PeopleOS — Protected Route Wrapper
 * Guarantees that wrapped routes are only accessible to authenticated users
 * with optional role-based authorization guards.
 */
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Loading from './Loading';

const ProtectedRoute = ({ allowedRoles = null }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading message="Verifying session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role || 'employee';
    if (!allowedRoles.includes(userRole)) {
      if (userRole === 'employee') {
        return <Navigate to="/employee/dashboard" replace />;
      }
      return <Navigate to="/hr/employees" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
