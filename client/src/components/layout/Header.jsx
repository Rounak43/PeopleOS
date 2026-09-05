/**
 * PeopleOS — Header Component
 * Top bar displayed above the main content area.
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
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
  const title = PAGE_TITLES[pathname] || 'PeopleOS';

  return (
    <header className="app-header">
      <div className="app-header-left">
        <h1 className="app-header-title">{title}</h1>
      </div>
      <div className="app-header-right">
        <div className="header-user-placeholder">
          <span className="header-avatar">👤</span>
          <span className="header-username">User</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
