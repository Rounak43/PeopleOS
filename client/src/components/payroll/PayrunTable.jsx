/**
 * PeopleOS — Payrun Table Component
 */
import React, { useState, useMemo } from 'react';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import { formatCurrency, formatDate, formatPeriod, getStatusBadgeClass } from '../../utils/formatters';

const PayrunTable = ({
  payruns = [],
  loading = false,
  onSelectPayrun,
  onCompute,
  onValidate,
  onMarkPaid,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = useMemo(() => {
    return payruns.filter((p) => {
      const matchSearch =
        !search ||
        (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
        (p.periodStart && p.periodStart.includes(search)) ||
        (p.periodEnd && p.periodEnd.includes(search));

      const matchStatus =
        statusFilter === 'ALL' ||
        (p.state || '').toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchStatus;
    });
  }, [payruns, search, statusFilter]);

  if (loading) {
    return (
      <div className="payroll-card" style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading payruns...</p>
      </div>
    );
  }

  if (!payruns || payruns.length === 0) {
    return (
      <div className="payroll-card">
        <EmptyState
          title="No payruns yet"
          message="Create your first payrun to begin processing employee payroll."
        />
      </div>
    );
  }

  return (
    <div className="payroll-card">
      <div className="payroll-card-header">
        <h3 className="payroll-card-title">Payruns</h3>
        <div className="payroll-filter-bar" style={{ margin: 0 }}>
          <input
            type="text"
            className="payroll-search-input"
            placeholder="Search payrun..."
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
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="payroll-table-wrapper">
        <table className="payroll-table">
          <thead>
            <tr>
              <th>Payrun</th>
              <th>Period</th>
              <th>Employees</th>
              <th>Gross</th>
              <th>Deductions</th>
              <th>Net</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const state = (p.state || 'Draft').toLowerCase();
              const gross = p.summary?.totalGross ?? p.totalGross ?? 0;
              const deductions = p.summary?.totalDeductions ?? p.totalDeductions ?? 0;
              const net = p.summary?.totalNet ?? p.totalNet ?? (gross - deductions);
              const empCount = p.summary?.employeeCount ?? p.employees?.length ?? 0;

              return (
                <tr key={p._id || p.id} onClick={() => onSelectPayrun(p)} style={{ cursor: 'pointer' }}>
                  <td>
                    <strong>{p.name || `Payrun ${formatDate(p.periodStart)}`}</strong>
                  </td>
                  <td>{formatPeriod(p.periodStart, p.periodEnd)}</td>
                  <td>{empCount}</td>
                  <td>{formatCurrency(gross)}</td>
                  <td style={{ color: '#dc2626' }}>{formatCurrency(deductions)}</td>
                  <td><strong>{formatCurrency(net)}</strong></td>
                  <td>
                    <span className={getStatusBadgeClass(p.state || 'Draft')}>{p.state || 'Draft'}</span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Button variant="secondary" size="sm" onClick={() => onSelectPayrun(p)}>
                        View
                      </Button>

                      {state === 'draft' && onCompute && (
                        <Button variant="primary" size="sm" onClick={() => onCompute(p._id)}>
                          Compute
                        </Button>
                      )}

                      {state === 'computed' && onValidate && (
                        <Button variant="primary" size="sm" onClick={() => onValidate(p._id)}>
                          Validate
                        </Button>
                      )}

                      {state === 'validated' && onMarkPaid && (
                        <Button variant="primary" size="sm" onClick={() => onMarkPaid(p._id)}>
                          Mark Paid
                        </Button>
                      )}
                    </div>
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

export default PayrunTable;
