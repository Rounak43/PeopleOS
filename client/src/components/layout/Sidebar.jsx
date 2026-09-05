/**
 * PeopleOS — Sidebar Navigation
 * Shared by all authenticated pages.
 * HR modules owned by Member 2. Payroll modules by Member 3.
 */
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Sidebar.css';

const HR_LINKS = [
  { path: '/hr/employees',          label: 'Employees',         icon: '👥' },
  { path: '/hr/departments',        label: 'Departments',       icon: '🏢' },
  { path: '/hr/job-positions',      label: 'Job Positions',     icon: '💼' },
  { path: '/hr/working-schedules',  label: 'Work Schedules',    icon: '🗓️' },
  { path: '/hr/contracts',          label: 'Contracts',         icon: '📄' },
  { path: '/hr/attendance',         label: 'Attendance',        icon: '⏱️' },
  { path: '/hr/time-off',           label: 'Time Off',          icon: '🏖️' },
];

const PAYROLL_LINKS = [
  { path: '/payroll/salary-structures', label: 'Salary Structures', icon: '🏗️' },
  { path: '/payroll/salary-rules',      label: 'Salary Rules',      icon: '📐' },
  { path: '/payroll/payruns',           label: 'Payruns',           icon: '💸' },
  { path: '/payroll/payslips',          label: 'Payslips',          icon: '🧾' },
  { path: '/payroll/dashboard',         label: 'Dashboard',         icon: '📊' },
];

const NavSection = ({ title, links }) => (
  <div className="sidebar-section">
    <span className="sidebar-section-label">{title}</span>
    <nav>
      {links.map(({ path, label, icon }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
          }
        >
          <span className="sidebar-link-icon">{icon}</span>
          <span className="sidebar-link-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  </div>
);

const Sidebar = () => {
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">🚀</span>
        <span className="sidebar-brand-name">PeopleOS</span>
      </div>

      <div className="sidebar-nav">
        <NavSection title="HR" links={HR_LINKS} />
        <NavSection title="Payroll" links={PAYROLL_LINKS} />
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <span className="sidebar-footer-text">v1.0.0 — Foundation</span>
      </div>
    </aside>
  );
};

export default Sidebar;
