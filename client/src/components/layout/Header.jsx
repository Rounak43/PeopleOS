/**
 * PeopleOS — Header Component
 * Top bar displayed above the main content area.
 */
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Header.css';

// Map route segments to readable page titles
const PAGE_TITLES = {
  '/hr/employees':           'Employees',
  '/hr/departments':         'Departments',
  '/hr/job-positions':       'Job Positions',
  '/hr/working-schedules':   'Working Schedules',
  '/hr/contracts':           'Contracts',
  '/hr/attendance':          'Attendance',
  '/hr/time-off':            'Time Off',
};

const Header = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const title = PAGE_TITLES[pathname] || 'PeopleOS';

  const handleLogout = () => {
    localStorage.removeItem('peopleos_token');
    localStorage.removeItem('peopleos_user');
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="app-header-left">
        <h1 className="app-header-title">{title}</h1>
      </div>
      <div className="app-header-right">
        <button
          type="button"
          className="header-user-placeholder"
          onClick={handleLogout}
          title="Click to sign out and return to Login page"
        >
          <span className="header-avatar">👤</span>
          <span className="header-username">Sign Out</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
