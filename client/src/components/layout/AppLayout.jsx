/**
 * PeopleOS — AppLayout Component
 * Wraps authenticated pages with Sidebar + Header + content area.
 */
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './AppLayout.css';

const AppLayout = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-layout-main">
        <Header />
        <main className="app-layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
