/**
 * PeopleOS — Professional Payslip Document
 * Clean printable document matching PeopleOS theme.
 */
import React from 'react';
import Button from '../common/Button';
import PayrollWarnings from './PayrollWarnings';
import { formatCurrency, formatDate, formatPeriod, getStatusBadgeClass } from '../../utils/formatters';

const PayslipDocument = ({ payslip, onClose, showActions = true }) => {
  if (!payslip) return null;

  const handlePrint = () => {
    window.print();
  };

  const lines = payslip.lines || [];
  const earnings = lines.filter((l) => l.category !== 'Deduction' && l.category !== 'Net' && l.category !== 'Gross');
  const deductions = lines.filter((l) => l.category === 'Deduction');

  const grossPay = payslip.grossPay ?? (lines.find((l) => l.code === 'GROSS')?.amount || 0);
  const totalDeductions = payslip.totalDeductions ?? (deductions.reduce((acc, d) => acc + (d.amount || 0), 0));
  const netPay = payslip.netPay ?? (grossPay - totalDeductions);

  return (
    <div>
      {/* Top Actions Bar (hidden during print) */}
      {showActions && (
        <div
          className="payslip-actions-bar"
          style={{
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <Button variant="secondary" onClick={onClose}>
            ← Back
          </Button>

          <Button variant="primary" onClick={handlePrint}>
            🖨️ Print Payslip
          </Button>
        </div>
      )}

      {/* Payslip Document */}
      <div className="payslip-document-wrapper">
        {/* Brand Header */}
        <div className="payslip-doc-header">
          <div className="payslip-brand">
            <h2>PEOPLEOS</h2>
            <p>HR & PAYROLL SERVICES</p>
          </div>

          <div className="payslip-title-block">
            <h3>PAYSLIP</h3>
            <p>Period: {formatPeriod(payslip.periodStart, payslip.periodEnd)}</p>
          </div>
        </div>

        {/* Warnings */}
        {payslip.warnings && payslip.warnings.length > 0 && (
          <PayrollWarnings warnings={payslip.warnings} />
        )}

        {/* Employee Info Grid */}
        <div className="payslip-info-grid">
          <div className="payslip-info-item">
            <span>Employee Name:</span>
            <span>{payslip.employeeNameSnapshot || payslip.employeeId?.fullName || 'Employee'}</span>
          </div>

          <div className="payslip-info-item">
            <span>Employee Code:</span>
            <span>{payslip.employeeCodeSnapshot || payslip.employeeId?.employeeCode || '—'}</span>
          </div>

          <div className="payslip-info-item">
            <span>Department:</span>
            <span>{payslip.departmentSnapshot || payslip.employeeId?.department?.name || '—'}</span>
          </div>

          <div className="payslip-info-item">
            <span>Job Position:</span>
            <span>{payslip.jobPositionSnapshot || payslip.employeeId?.jobPosition?.title || '—'}</span>
          </div>

          <div className="payslip-info-item">
            <span>Contract Ref:</span>
            <span>{payslip.contractRefSnapshot || 'CNT-STD'}</span>
          </div>

          <div className="payslip-info-item">
            <span>Status:</span>
            <span className={getStatusBadgeClass(payslip.state || 'Draft')}>{payslip.state || 'Draft'}</span>
          </div>
        </div>

        {/* Net Take-Home Pay Banner */}
        <div className="payslip-net-banner">
          <div>
            <div className="payslip-net-label">NET TAKE-HOME PAY</div>
            <div style={{ fontSize: '11px', color: '#9a3412', marginTop: '2px' }}>
              Direct Bank Transfer
            </div>
          </div>
          <div className="payslip-net-amount">{formatCurrency(netPay)}</div>
        </div>

        {/* Breakdown Grid */}
        <div className="payslip-breakdown-grid">
          {/* Earnings Column */}
          <div className="payslip-breakdown-col">
            <h4>EARNINGS</h4>
            {earnings.length > 0 ? (
              earnings.map((e, idx) => (
                <div key={idx} className="payslip-line-item">
                  <span>{e.name} ({e.code})</span>
                  <span>{formatCurrency(e.amount)}</span>
                </div>
              ))
            ) : (
              <div className="payslip-line-item">
                <span>Basic Salary</span>
                <span>{formatCurrency(grossPay)}</span>
              </div>
            )}

            <div className="payslip-total-row" style={{ color: '#166534', background: '#f0fdf4' }}>
              <span>Gross Earnings</span>
              <span>{formatCurrency(grossPay)}</span>
            </div>
          </div>

          {/* Deductions Column */}
          <div className="payslip-breakdown-col">
            <h4>DEDUCTIONS</h4>
            {deductions.length > 0 ? (
              deductions.map((d, idx) => (
                <div key={idx} className="payslip-line-item">
                  <span>{d.name} ({d.code})</span>
                  <span style={{ color: '#dc2626' }}>- {formatCurrency(d.amount)}</span>
                </div>
              ))
            ) : (
              <div className="payslip-line-item" style={{ color: '#64748b' }}>
                <span>No Deductions</span>
                <span>₹0.00</span>
              </div>
            )}

            <div className="payslip-total-row" style={{ color: '#991b1b', background: '#fef2f2' }}>
              <span>Total Deductions</span>
              <span>- {formatCurrency(totalDeductions)}</span>
            </div>
          </div>
        </div>

        {/* Attendance & Hours summary */}
        <div
          style={{
            background: '#f8fafc',
            padding: '12px 16px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            marginBottom: '24px',
            fontSize: '12px',
            display: 'flex',
            justify: 'space-between',
          }}
        >
          <div><strong>Worked Days:</strong> {payslip.workedDays ?? 30} days</div>
          <div><strong>Regular Hours:</strong> {payslip.regularHours ?? 160} hrs</div>
          <div><strong>Overtime Hours:</strong> {payslip.overtimeHours ?? 0} hrs</div>
          <div><strong>Salary Structure:</strong> {payslip.salaryStructureNameSnapshot || 'Standard'}</div>
        </div>

        {/* Dynamic Salary Computation Table */}
        <div>
          <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Salary Rule Computation Lines</h4>
          <table className="payslip-computation-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Rule Name</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, idx) => (
                <tr key={idx}>
                  <td><strong>{l.code}</strong></td>
                  <td>{l.name}</td>
                  <td>{l.category}</td>
                  <td style={{ textAlign: 'right', fontWeight: l.category === 'Net' ? 'bold' : 'normal' }}>
                    {formatCurrency(l.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PayslipDocument;
