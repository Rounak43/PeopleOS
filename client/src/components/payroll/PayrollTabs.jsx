/**
 * PeopleOS — Payroll Tabs Navigation
 */
import React from 'react';

const PayrollTabs = ({ activeTab, onTabChange, activeConfigTab, onConfigTabChange }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'payruns', label: 'Payruns', icon: '📝' },
    { id: 'payslips', label: 'Payslips', icon: '📄' },
    { id: 'configuration', label: 'Configuration', icon: '⚙️' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="payroll-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`payroll-tab-btn ${activeTab === t.id ? 'payroll-tab-btn--active' : ''}`}
            onClick={() => onTabChange(t.id)}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'configuration' && (
        <div className="payroll-subtabs">
          <button
            type="button"
            className={`payroll-subtab-btn ${activeConfigTab === 'structures' ? 'payroll-subtab-btn--active' : ''}`}
            onClick={() => onConfigTabChange('structures')}
          >
            Salary Structures
          </button>
          <button
            type="button"
            className={`payroll-subtab-btn ${activeConfigTab === 'rules' ? 'payroll-subtab-btn--active' : ''}`}
            onClick={() => onConfigTabChange('rules')}
          >
            Salary Rules
          </button>
        </div>
      )}
    </div>
  );
};

export default PayrollTabs;
