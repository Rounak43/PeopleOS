/**
 * PeopleOS — Header Component
 * Styled exactly to match the AegisFlow Employee Portal design.
 */
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = (user?.name || user?.email?.split('@')[0] || 'samarth suryavamshi').toLowerCase();
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('') || 'SS';

  const roleLabel = (user?.role || 'employee').toUpperCase();

  // Current formatted date matching screenshot (e.g. Sat, Sep 5)
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const isHRRoute = location.pathname.startsWith('/hr');
  const portalTitle = isHRRoute ? 'HR Portal' : 'Employee Portal';

  return (
    <header className="aegis-header">
      <div className="aegis-header-left">
        {/* Hamburger button */}
        <button type="button" className="aegis-menu-btn" aria-label="Menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <h1 className="aegis-header-title">{portalTitle}</h1>

        {/* Date Chip */}
        <div className="aegis-date-chip">
          <span className="aegis-date-dot" />
          <span>{dateStr}</span>
        </div>
      </div>

      <div className="aegis-header-right">
        {/* Notification Bell */}
        <button type="button" className="aegis-bell-btn" title="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="aegis-bell-badge">1</span>
        </button>

        {/* User Pill Dropdown */}
        <button
          type="button"
          className="aegis-user-pill"
          onClick={handleLogout}
          title="Click to sign out"
        >
          <div className="aegis-avatar-circle">{initials}</div>
          <div className="aegis-user-info">
            <span className="aegis-user-name">{displayName}</span>
            <span className="aegis-user-role">{roleLabel}</span>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="aegis-chevron">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;
