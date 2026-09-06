/**
 * PeopleOS — Payslips Table Component
 */
import React, { useState, useMemo } from 'react';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import { formatCurrency, formatPeriod, getStatusBadgeClass } from '../../utils/formatters';

const PayslipTable = ({ payslips = [], loading = false, onViewPayslip }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = useMemo(() => {
    return payslips.filter((ps) => {
      const empName = ps.employeeNameSnapshot || ps.employeeId?.fullName || '';
      const empCode = ps.employeeCodeSnapshot || ps.employeeId?.employeeCode || '';
      const matchSearch =
        !search ||
        empName.toLowerCase().includes(search.toLowerCase()) ||
        empCode.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === 'ALL' ||
        (ps.state || '').toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchStatus;
    });
  }, [payslips, search, statusFilter]);

  if (loading) {
    return (
      <div className="payroll-card" style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading payslips...</p>
      </div>
    );
  }

  if (!payslips || payslips.length === 0) {
    return (
      <div className="payroll-card">
        <EmptyState
          title="No payslips found"
          message="Payslips will appear here once a payrun is computed."
        />
      </div>
    );
  }

  return (
    <div className="payroll-card">
      <div className="payroll-card-header">
        <h3 className="payroll-card-title">Employee Payslips ({filtered.length})</h3>
        <div className="payroll-filter-bar" style={{ margin: 0 }}>
          <input
            type="text"
            className="payroll-search-input"
            placeholder="Search employee or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="payroll-select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Computed">Computed</option>
            <option value="Validated">Validated</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      <div className="payroll-table-wrapper">
        <table className="payroll-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Employee Code</th>
              <th>Period</th>
              <th>Gross</th>
              <th>Deductions</th>
              <th>Net Pay</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ps) => {
              const empName = ps.employeeNameSnapshot || ps.employeeId?.fullName || 'Employee';
              const empCode = ps.employeeCodeSnapshot || ps.employeeId?.employeeCode || '—';
              const gross = ps.grossPay ?? 0;
              const deductions = ps.totalDeductions ?? 0;
              const net = ps.netPay ?? (gross - deductions);

              return (
                <tr key={ps._id || ps.id} onClick={() => onViewPayslip(ps)} style={{ cursor: 'pointer' }}>
                  <td><strong>{empName}</strong></td>
                  <td>{empCode}</td>
                  <td>{formatPeriod(ps.periodStart, ps.periodEnd)}</td>
                  <td>{formatCurrency(gross)}</td>
                  <td style={{ color: '#dc2626' }}>{formatCurrency(deductions)}</td>
                  <td><strong>{formatCurrency(net)}</strong></td>
                  <td>
                    <span className={getStatusBadgeClass(ps.state || 'Draft')}>{ps.state || 'Draft'}</span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <Button variant="secondary" size="sm" onClick={() => onViewPayslip(ps)}>
                      View
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayslipTable;
