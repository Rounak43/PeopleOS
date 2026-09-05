/**
 * PeopleOS — Sidebar Navigation
 * Shared by all authenticated pages.
 * HR modules management.
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
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
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <span className="sidebar-footer-text">v1.0.0 — Foundation</span>
      </div>
    </aside>
  );
};

export default Sidebar;
