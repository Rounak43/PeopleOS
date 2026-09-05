/**
 * PeopleOS — Route Configuration
 * Dedicated Login Page Route
 */
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Loading from '../components/common/Loading';

const LoginPage = lazy(() => import('../pages/auth/LoginPage'));

const AppRoutes = () => {
  return (
    <Suspense fallback={<Loading message="Loading..." />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
