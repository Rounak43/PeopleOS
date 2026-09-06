/**
 * PeopleOS — PayslipTable Component
 * Displays real-time payslip records fetched from backend APIs.
 * Supports employee details, employeeCode (e.g. OS26DS010), earnings, deductions, net pay, and status.
 */
import React from 'react';
import Loading from '../../common/Loading';
import ErrorMessage from '../../common/ErrorMessage';
import EmptyState from '../../common/EmptyState';
import Button from '../../common/Button';

const PayslipTable = ({ data = [], loading = false, error = null, onViewPayslip }) => {
  if (loading) return <Loading message="Loading payslips from MongoDB backend..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!data.length) return <EmptyState title="No Payslips Found" description="No payslips generated for this period." />;

  return (
    <div className="table-container card" style={{ padding: 0 }}>
      <table className="employees-data-table">
        <thead>
          <tr>
            <th style={{ width: '5%' }}>#</th>
            <th style={{ width: '22%' }}>Employee Name</th>
            <th style={{ width: '13%' }}>Employee ID</th>
            <th style={{ width: '18%' }}>Pay Period</th>
            <th style={{ width: '12%', textAlign: 'right' }}>Gross Pay</th>
            <th style={{ width: '12%', textAlign: 'right' }}>Deductions</th>
            <th style={{ width: '12%', textAlign: 'right' }}>Net Take-Home</th>
            <th style={{ width: '10%', textAlign: 'center' }}>Status</th>
            <th style={{ width: '12%', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const emp = item.employee || {};
            const fullName = emp.fullName || emp.name || (emp.firstName ? `${emp.firstName} ${emp.lastName || ''}`.trim() : '') || emp.email || 'Staff Member';
            const empCode = emp.employeeCode || emp.empId || item.employeeCode || 'N/A';
            const period = item.payrun?.name || item.payPeriod || 'Monthly Payroll';

            const gross = Number(item.grossPay || 0);
            const net = Number(item.netPay || 0);
            const deductions = Math.max(0, gross - net);

            const isPaid = (item.state || '').toUpperCase() === 'PAID';

            return (
              <tr key={item._id || item.id || index}>
                <td>{index + 1}</td>
                <td>
                  <div className="employee-cell">
                    <span className="emp-avatar-icon">👤</span>
                    <div className="emp-name-block">
                      <span className="font-semibold text-slate-800">{fullName}</span>
                      <div className="emp-sub-text">{emp.email || 'N/A'}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="emp-id-tag font-mono text-indigo-600">{empCode}</span>
                </td>
                <td>
                  <span className="text-slate-700 font-medium">{period}</span>
                </td>
                <td style={{ textAlign: 'right', fontWeight: '600', color: '#334155' }}>
                  ₹{gross.toLocaleString('en-IN')}
                </td>
                <td style={{ textAlign: 'right', fontWeight: '600', color: '#DC2626' }}>
                  -₹{deductions.toLocaleString('en-IN')}
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800', color: '#16a34a' }}>
                  ₹{net.toLocaleString('en-IN')}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span className={`badge ${isPaid ? 'badge-success' : 'badge-warning'}`}>
                    {isPaid ? 'PAID / RECEIVED' : (item.state || 'VERIFIED').toUpperCase()}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {onViewPayslip && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onViewPayslip(item)}
                    >
                      🖨️ View Payslip
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PayslipTable;
