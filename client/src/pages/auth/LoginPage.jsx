import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { signin, signup } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const validateForm = () => {
    setErrorMessage('');
    if (!email || !email.trim()) {
      setErrorMessage('Email address is required.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setErrorMessage('Password is required.');
      return false;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
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
      if (isSignUp) {
        await signup({
          email: email.trim(),
          password,
          role: 'employee',
        });
        setInfoMessage('Account created successfully! Redirecting...');
      } else {
        await signin({
          email: email.trim(),
          password,
        });
      }
      setTimeout(() => {
        navigate('/hr/employees');
      }, 500);
    } catch (error) {
      console.error('Authentication error:', error);
      if (error.status === 401) {
        setErrorMessage('Invalid email or password.');
      } else if (error.status === 409) {
        setErrorMessage('An account with this email address already exists.');
      } else if (error.status === 403) {
        setErrorMessage("You don't have permission to perform this action.");
      } else if (error.status === 400) {
        setErrorMessage(error.data?.message || 'Invalid input details provided.');
      } else if (error.status === 500) {
        setErrorMessage('Server error occurred. Please try again later.');
      } else {
        setErrorMessage(error.message || 'Unable to connect to the authentication server.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setInfoMessage('Password reset link will be sent to your registered email address.');
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
    <div className="login-container">
      <div className="login-card">
        {/* Brand Header */}
        <div className="login-brand">
          <h1 className="brand-logo">
            People<span className="brand-accent">OS</span>
          </h1>
          <p className="brand-tagline">HR &amp; Payroll Management System</p>
        </div>

        {/* Header */}
        <div className="login-header">
          <h2 className="login-title">{isSignUp ? 'Create Account' : 'Sign In'}</h2>
          <p className="login-subtitle">
            {isSignUp
              ? 'Fill in your details below to create your PeopleOS user account'
              : 'Sign in with your email and password to access your portal'}
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="login-info-banner error-banner" style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' }} role="alert">
            {errorMessage}
          </div>
        )}

        {/* Info Banner */}
        {infoMessage && (
          <div className="login-info-banner" role="alert">
            {infoMessage}
          </div>
        )}

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address <span className="required-star">*</span>
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="name@peopleos.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={isSubmitting}
            />
          </div>

          {/* Password Field */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="password" className="form-label">
                Password <span className="required-star">*</span>
              </label>
              {!isSignUp && (
                <button
                  type="button"
                  className="forgot-password-btn"
                  onClick={handleForgotPassword}
                  disabled={isSubmitting}
                >
                  Forgot password?
                </button>
              )}
            </div>

            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input password-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password Field (Sign Up Mode) */}
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password <span className="required-star">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Remember Me Checkbox (Sign In Mode) */}
          {!isSignUp && (
            <div className="remember-me-group">
              <label className="checkbox-label-wrapper">
                <input
                  type="checkbox"
                  className="custom-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isSubmitting}
                />
                <span className="checkbox-text">Keep me signed in for 30 days</span>
              </label>
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" className="submit-signin-btn" disabled={isSubmitting}>
            {isSubmitting
              ? isSignUp
                ? 'Creating account...'
                : 'Signing in...'
              : isSignUp
              ? 'SIGN UP'
              : 'SIGN IN'}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p className="signup-prompt">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" className="signup-link" onClick={toggleMode} disabled={isSubmitting}>
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
