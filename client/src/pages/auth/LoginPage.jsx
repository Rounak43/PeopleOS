/**
 * PO System — Minimal HR & Payroll Portal Sign In Page
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { signin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const validateForm = () => {
    setErrorMessage('');
    if (!email || !email.trim()) {
      setErrorMessage('Email or Employee ID is required.');
      return false;
    }
    if (!password) {
      setErrorMessage('Password is required.');
      return false;
    }
    if (password.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      const res = await signin({
        email: email.trim(),
        identifier: email.trim(),
        password,
      });
      const authUser = res?.user;
      const role = authUser?.role || 'employee';

      setTimeout(() => {
        if (role === 'employee') {
          navigate('/employee/dashboard');
        } else {
          navigate('/hr/employees');
        }
      }, 300);
    } catch (error) {
      console.error('Authentication error:', error);
      if (error.status === 401) {
        setErrorMessage(error.message || 'Invalid email/Employee ID or password.');
      } else if (error.status === 400) {
        setErrorMessage(error.data?.message || 'Invalid input details provided.');
      } else {
        setErrorMessage(error.message || 'Unable to connect to the authentication server.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setInfoMessage('Password reset instructions will be sent to your registered email.');
    setTimeout(() => setInfoMessage(''), 4000);
  };

  return (
    <div className="po-login-wrapper">
      <main className="po-login-main">
        <div className="po-login-content-box">

          {/* Logo & Title Block */}
          <div className="po-header-brand">
            <div className="po-logo-badge">
              <span className="po-logo-p">P</span>
              <span className="po-logo-o">OS</span>
            </div>
            <h1 className="po-title">PeopleOS</h1>
            <p className="po-subtitle">HR &amp; Payroll Management System</p>
          </div>

          {/* Auth Card */}
          <div className="po-auth-card">
            <div className="po-card-header">
              <h2 className="po-card-title">Sign In</h2>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="po-alert-banner error" role="alert">
                {errorMessage}
              </div>
            )}

            {/* Info Alert */}
            {infoMessage && (
              <div className="po-alert-banner info" role="alert">
                {infoMessage}
              </div>
            )}

            <form className="po-form" onSubmit={handleSubmit}>
              {/* Email / Identifier Field */}
              <div className="po-field-group">
                <label htmlFor="email" className="po-label">
                  Email or Employee ID
                </label>
                <input
                  type="text"
                  id="email"
                  placeholder="user@peopleos.com or OS26DS010"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="po-input"
                  disabled={isSubmitting}
                />
              </div>

              {/* Password Field */}
              <div className="po-field-group">
                <div className="po-label-row">
                  <label htmlFor="pass" className="po-label">Password</label>
                  <button
                    type="button"
                    className="po-forgot-link"
                    onClick={handleForgotPassword}
                    disabled={isSubmitting}
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="pass"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="po-input"
                  disabled={isSubmitting}
                />
              </div>

              {/* Show Pass Checkbox */}
              <div className="po-checkbox-row">
                <input
                  type="checkbox"
                  id="togglePass"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="po-checkbox"
                  disabled={isSubmitting}
                />
                <label htmlFor="togglePass" className="po-checkbox-label">
                  Show Password
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="po-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          </div>

          {/* Trust Badges */}
          <div className="po-trust-badges">
            <span className="po-badge-item">
              <svg className="po-badge-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Encrypted
            </span>
            <span className="po-badge-item">
              <svg className="po-badge-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Direct Deposit
            </span>
            <span className="po-badge-item">
              <svg className="po-badge-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Automated Tax
            </span>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="po-footer">
        <div className="po-footer-container">
          <p>&copy; 2026 PeopleOS HR &amp; Payroll Management System. All rights reserved.</p>
          <div className="po-footer-links">
            <a href="#privacy" className="po-footer-link">Privacy Policy</a>
            <a href="#terms" className="po-footer-link">Terms of Service</a>
            <a href="#security" className="po-footer-link">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
