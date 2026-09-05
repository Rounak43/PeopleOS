/**
 * PO System — Minimal HR & Payroll Portal Sign In Page
 * Recreates exact requested UI structure using Vanilla CSS & connects with authentication backend.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { signin, signup } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [signupRole, setSignupRole] = useState('hr_manager'); // 'hr_manager' or 'employee'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const validateForm = () => {
    setErrorMessage('');
    if (!email || !email.trim()) {
      setErrorMessage(isSignUp ? 'Email address is required.' : 'Email or Employee ID is required.');
      return false;
    }
    if (isSignUp) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setErrorMessage('Please enter a valid email address.');
        return false;
      }
    }
    if (!password) {
      setErrorMessage('Password is required.');
      return false;
    }
    if (password.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return false;
    }
    if (isSignUp && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
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
      let authUser = null;
      if (isSignUp) {
        const res = await signup({
          email: email.trim(),
          password,
          role: signupRole,
        });
        authUser = res?.user;
        setInfoMessage('Account created successfully! Redirecting...');
      } else {
        const res = await signin({
          email: email.trim(),
          identifier: email.trim(),
          password,
        });
        authUser = res?.user;
      }

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
      } else if (error.status === 409) {
        setErrorMessage('An account with this email address already exists.');
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

  const toggleMode = (e) => {
    e.preventDefault();
    setIsSignUp(!isSignUp);
    setErrorMessage('');
    setInfoMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="po-login-wrapper">
      {/* Main Container */}
      <main className="po-login-main">
        <div className="po-login-content-box">

          {/* Logo & Title Block */}
          <div className="po-header-brand">
            <div className="po-logo-badge">
              <span className="po-logo-p">P</span>
              <span className="po-logo-o">O</span>
            </div>
            <h1 className="po-title">PO System Portal</h1>
            <p className="po-subtitle">HR &amp; Payroll Management Sys</p>
          </div>

          {/* Auth Card */}
          <div className="po-auth-card">
            <div className="po-card-header">
              <h2 className="po-card-title">{isSignUp ? 'Create Account' : 'Sign In'}</h2>
              <button type="button" className="po-toggle-mode-btn" onClick={toggleMode} disabled={isSubmitting}>
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
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
              {/* Role Selection (Sign Up Mode) */}
              {isSignUp && (
                <div className="po-field-group">
                  <label className="po-label">Account Role</label>
                  <div className="po-role-grid">
                    <label className={`po-role-card ${signupRole === 'hr_manager' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="role"
                        checked={signupRole === 'hr_manager'}
                        onChange={() => setSignupRole('hr_manager')}
                      />
                      <span>🏢 HR Admin</span>
                    </label>
                    <label className={`po-role-card ${signupRole === 'employee' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="role"
                        checked={signupRole === 'employee'}
                        onChange={() => setSignupRole('employee')}
                      />
                      <span>👤 Employee</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Email / Identifier Field */}
              <div className="po-field-group">
                <label htmlFor="email" className="po-label">
                  {isSignUp ? 'Email' : 'Email or Employee ID'}
                </label>
                <input
                  type="text"
                  id="email"
                  placeholder={isSignUp ? 'user@posystem.com' : 'user@posystem.com or EMP-101'}
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
                  <label htmlFor="pass" className="po-label">Pass</label>
                  {!isSignUp && (
                    <button
                      type="button"
                      className="po-forgot-link"
                      onClick={handleForgotPassword}
                      disabled={isSubmitting}
                    >
                      forgot pass?
                    </button>
                  )}
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

              {/* Confirm Password (Sign Up Mode) */}
              {isSignUp && (
                <div className="po-field-group">
                  <label htmlFor="confirmPass" className="po-label">Confirm Pass</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPass"
                    placeholder="••••••••"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="po-input"
                    disabled={isSubmitting}
                  />
                </div>
              )}

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
                  Show Pass
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="po-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? isSignUp ? 'Creating Account...' : 'Signing In...'
                  : isSignUp ? 'Sign Up' : 'Sign In'}
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
          <p>&copy; 2026 PO HR &amp; Payroll Management System. All rights reserved.</p>
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
