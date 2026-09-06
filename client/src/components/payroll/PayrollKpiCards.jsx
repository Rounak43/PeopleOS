/**
 * PeopleOS — Payroll KPI Cards
 */
import React from 'react';
import { formatCurrency } from '../../utils/formatters';

const PayrollKpiCards = ({ kpis = {}, loading = false }) => {
  const cards = [
    {
      id: 'emp',
      label: 'Total Employees',
      value: loading ? '...' : (kpis.totalEmployees ?? '0'),
      icon: '👥',
    },
    {
      id: 'current',
      label: 'Current Payrun',
      value: loading ? '...' : (kpis.currentPayrunName || 'None'),
      icon: '📅',
    },
    {
      id: 'gross',
      label: 'Gross Payroll',
      value: loading ? '...' : formatCurrency(kpis.grossPayroll || 0),
      icon: '💰',
    },
    {
      id: 'net',
      label: 'Net Payroll',
      value: loading ? '...' : formatCurrency(kpis.netPayroll || 0),
      icon: '💵',
    },
  ];

  return (
    <div className="payroll-kpi-grid">
      {cards.map((c) => (
        <div key={c.id} className="payroll-kpi-card">
          <div className="payroll-kpi-icon">{c.icon}</div>
          <div className="payroll-kpi-content">
            <span className="payroll-kpi-label">{c.label}</span>
            <span className="payroll-kpi-value">{c.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PayrollKpiCards;
