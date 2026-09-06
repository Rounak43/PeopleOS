/**
 * PeopleOS — Payrun Details View
 */
import React from 'react';
import Button from '../common/Button';
import PayrunActions from './PayrunActions';
import PayrollWarnings from './PayrollWarnings';
import { formatCurrency, formatPeriod, getStatusBadgeClass } from '../../utils/formatters';

const PayrunDetails = ({
  payrun,
  payslips = [],
  loadingPayslips = false,
  onBack,
  onCompute,
  onValidate,
  onMarkPaid,
  onViewPayslip,
  loadingAction,
}) => {
  if (!payrun) return null;

  const gross = payrun.summary?.totalGross ?? payrun.totalGross ?? 0;
  const deductions = payrun.summary?.totalDeductions ?? payrun.totalDeductions ?? 0;
  const net = payrun.summary?.totalNet ?? payrun.totalNet ?? (gross - deductions);
  const empCount = payrun.summary?.employeeCount ?? payrun.employees?.length ?? payslips.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Detail Header & Action Bar */}
      <div className="payroll-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <Button variant="secondary" size="sm" onClick={onBack} style={{ marginBottom: '8px' }}>
              ← Back to Payruns
            </Button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontSize: '20px', margin: 0, fontWeight: 700 }}>
                {payrun.name || 'Payrun Detail'}
              </h2>
              <span className={getStatusBadgeClass(payrun.state || 'Draft')}>
                {payrun.state || 'Draft'}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Period: {formatPeriod(payrun.periodStart, payrun.periodEnd)}
            </p>
          </div>

          <PayrunActions
            payrun={payrun}
            onCompute={onCompute}
            onValidate={onValidate}
            onMarkPaid={onMarkPaid}
            loadingAction={loadingAction}
          />
        </div>
      </div>

      {/* Payrun Summary KPI Cards */}
      <div className="payroll-kpi-grid">
        <div className="payroll-kpi-card">
          <div className="payroll-kpi-icon">👥</div>
          <div className="payroll-kpi-content">
            <span className="payroll-kpi-label">Employees Included</span>
            <span className="payroll-kpi-value">{empCount}</span>
          </div>
        </div>

        <div className="payroll-kpi-card">
          <div className="payroll-kpi-icon">💰</div>
          <div className="payroll-kpi-content">
            <span className="payroll-kpi-label">Gross Payroll</span>
            <span className="payroll-kpi-value">{formatCurrency(gross)}</span>
          </div>
        </div>

        <div className="payroll-kpi-card">
          <div className="payroll-kpi-icon">📉</div>
          <div className="payroll-kpi-content">
            <span className="payroll-kpi-label">Total Deductions</span>
            <span className="payroll-kpi-value" style={{ color: '#dc2626' }}>
              {formatCurrency(deductions)}
            </span>
          </div>
        </div>

        <div className="payroll-kpi-card">
          <div className="payroll-kpi-icon">💵</div>
          <div className="payroll-kpi-content">
            <span className="payroll-kpi-label">Net Take-Home Payroll</span>
            <span className="payroll-kpi-value" style={{ color: '#ea580c' }}>
              {formatCurrency(net)}
            </span>
          </div>
        </div>
      </div>

      {/* Warnings Callout */}
      {payrun.warnings && payrun.warnings.length > 0 && (
        <PayrollWarnings warnings={payrun.warnings} />
      )}

      {/* Payslips Table */}
      <div className="payroll-card">
        <div className="payroll-card-header">
          <h3 className="payroll-card-title">Generated Payslips ({payslips.length})</h3>
        </div>

        {loadingPayslips ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px' }}>
            Loading payslips...
          </p>
        ) : payslips.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', padding: '20px', textAlign: 'center' }}>
            No payslips generated yet. Click <strong>Compute Payroll</strong> to generate employee payslips.
          </p>
        ) : (
          <div className="payroll-table-wrapper">
            <table className="payroll-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Emp Code</th>
                  <th>Contract</th>
                  <th>Gross</th>
                  <th>Deductions</th>
                  <th>Net</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map((ps) => {
                  const empName = ps.employeeNameSnapshot || ps.employeeId?.fullName || 'Employee';
                  const empCode = ps.employeeCodeSnapshot || ps.employeeId?.employeeCode || '—';
                  const psGross = ps.grossPay ?? 0;
                  const psDed = ps.totalDeductions ?? 0;
                  const psNet = ps.netPay ?? (psGross - psDed);

                  return (
                    <tr key={ps._id || ps.id}>
                      <td><strong>{empName}</strong></td>
                      <td>{empCode}</td>
                      <td>{ps.contractRefSnapshot || 'CNT-STD'}</td>
                      <td>{formatCurrency(psGross)}</td>
                      <td style={{ color: '#dc2626' }}>{formatCurrency(psDed)}</td>
                      <td><strong>{formatCurrency(psNet)}</strong></td>
                      <td>
                        <span className={getStatusBadgeClass(ps.state || payrun.state)}>
                          {ps.state || payrun.state || 'Draft'}
                        </span>
                      </td>
                      <td>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onViewPayslip(ps)}
                        >
                          View Payslip
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrunDetails;
