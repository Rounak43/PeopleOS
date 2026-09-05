/**
 * PeopleOS — Login Page (Placeholder)
 * Authentication will be implemented by Member 1.
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = () => {
  // TODO: Member 1 will implement actual authentication here.
  // For now, redirect straight to the app.
  return <Navigate to="/hr/employees" replace />;
};

export default LoginPage;
