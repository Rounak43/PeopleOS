/**
 * PeopleOS — Login Page
 * Exact implementation matching the design specification.
 */
import React, { useState } from 'react';
import './LoginPage.css';

const LoginPage = () => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const userEmail = email.trim() || 'name@peopleos.com';
    localStorage.setItem('peopleos_token', 'session_' + Date.now());
    localStorage.setItem(
      'peopleos_user',
      JSON.stringify({
        email: userEmail,
        name: userEmail.split('@')[0],
        role: 'Admin',
      })
    );
    setInfoMessage(`✓ Signed in successfully as ${userEmail}`);
    setTimeout(() => setInfoMessage(''), 4000);
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setInfoMessage('Password reset link will be sent to your registered email address.');
    setTimeout(() => setInfoMessage(''), 4000);
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    setInfoMessage('Registration is managed by your organization HR administrator.');
    setTimeout(() => setInfoMessage(''), 4000);
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

        {/* Sign In Header */}
        <div className="login-header">
          <h2 className="login-title">Sign In</h2>
          <p className="login-subtitle">
            Sign in with your email and password to access your portal
          </p>
        </div>

        {infoMessage && (
          <div className="login-info-banner" role="alert">
            {infoMessage}
          </div>
        )}

        {/* Login Form */}
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
            />
          </div>

          {/* Password Field */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="password" className="form-label">
                Password <span className="required-star">*</span>
              </label>
              <button
                type="button"
                className="forgot-password-btn"
                onClick={handleForgotPassword}
              >
                Forgot password?
              </button>
            </div>

            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input password-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
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

          {/* Remember Me Checkbox */}
          <div className="remember-me-group">
            <label className="checkbox-label-wrapper">
              <input
                type="checkbox"
                className="custom-checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="checkbox-text">Keep me signed in for 30 days</span>
            </label>
          </div>

          {/* Sign In Button */}
          <button type="submit" className="submit-signin-btn">
            SIGN IN
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p className="signup-prompt">
            Don't have an account?{' '}
            <button type="button" className="signup-link" onClick={handleSignUp}>
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
