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
  '/payroll/salary-structures': 'Salary Structures',
  '/payroll/salary-rules':      'Salary Rules',
  '/payroll/payruns':           'Payruns',
  '/payroll/payslips':          'Payslips',
  '/payroll/dashboard':         'Payroll Dashboard',
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
        {/* Auth context will be wired by Member 1 */}
        <div className="header-user-placeholder">
          <span className="header-avatar">👤</span>
          <span className="header-username">User</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
