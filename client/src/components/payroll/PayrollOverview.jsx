/**
 * PeopleOS — Payroll Overview Component
 */
import React from 'react';
import PayrollKpiCards from './PayrollKpiCards';
import PayrunTable from './PayrunTable';
import { formatCurrency } from '../../utils/formatters';

const PayrollOverview = ({
  kpis,
  payruns = [],
  loading = false,
  onCreatePayrun,
  onSelectPayrun,
  onCompute,
  onValidate,
  onMarkPaid,
}) => {
  // Compute overall summary totals
  const totalGross = payruns.reduce((acc, p) => acc + (p.summary?.totalGross ?? p.totalGross ?? 0), 0);
  const totalDeductions = payruns.reduce((acc, p) => acc + (p.summary?.totalDeductions ?? p.totalDeductions ?? 0), 0);
  const totalNet = payruns.reduce((acc, p) => acc + (p.summary?.totalNet ?? p.totalNet ?? (p.totalGross - p.totalDeductions) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* KPI Cards */}
      <PayrollKpiCards kpis={kpis} loading={loading} />

      {/* Recent Payruns Table */}
      <PayrunTable
        payruns={payruns.slice(0, 5)}
        loading={loading}
        onSelectPayrun={onSelectPayrun}
        onCompute={onCompute}
        onValidate={onValidate}
        onMarkPaid={onMarkPaid}
      />

      {/* Payroll Summary Box */}
      <div className="payroll-card">
        <div className="payroll-card-header">
          <h3 className="payroll-card-title">Cumulative Payroll Summary</h3>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            background: 'var(--color-bg, #fcfbf9)',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid var(--color-border, #ffedd5)',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>GROSS PAYROLL</div>
            <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px' }}>{formatCurrency(totalGross)}</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>TOTAL DEDUCTIONS</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626', marginTop: '4px' }}>{formatCurrency(totalDeductions)}</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>NET PAYROLL</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#ea580c', marginTop: '4px' }}>{formatCurrency(totalNet)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollOverview;
