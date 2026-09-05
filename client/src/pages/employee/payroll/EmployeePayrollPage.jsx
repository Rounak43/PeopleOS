/**
 * PeopleOS — Employee Payroll & Payslips Page
 * Route: /employee/payroll
 *
 * Displays employee's confidential salary payslips and detailed breakdown modal.
 * Uses ₹ INR currency formatting and integrates PayslipDetailModal.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Button from '../../../components/common/Button';
import EmptyState from '../../../components/common/EmptyState';
import ErrorMessage from '../../../components/common/ErrorMessage';
import Loading from '../../../components/common/Loading';
import PayslipDetailModal from '../../../components/hr/payroll/PayslipDetailModal';
import {
  getPayslips,
  getPayslipById,
} from '../../../services/employee/employeePortalService';
import '../employee.css';

const EmployeePayrollPage = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected Payslip Detail Modal
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const fetchPayslipData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPayslips();
      const list = res.data || res;
      setPayslips(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load payslips:', err);
      setError(err.message || 'Unable to retrieve payslip records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayslipData();
  }, [fetchPayslipData]);

  const handleViewPayslip = async (payslipId) => {
    try {
      const res = await getPayslipById(payslipId);
      setSelectedPayslip(res.data || res);
    } catch (err) {
      console.error('Failed to view payslip detail:', err);
    }
  };

  if (loading) {
    return <Loading message="Loading your payslips..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchPayslipData} />;
  }

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderStateBadge = (state) => {
    switch ((state || '').toUpperCase()) {
      case 'PAID':
        return <span className="badge badge-success">PAID / RECEIVED</span>;
      case 'VERIFIED':
        return <span className="badge badge-info">VERIFIED</span>;
      default:
        return <span className="badge badge-neutral">{state || 'Draft'}</span>;
    }
  };

  return (
    <div className="module-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">My Payroll &amp; Payslips</h2>
          <p className="page-subtitle">Access your verified salary payments and tax deduction statements</p>
        </div>
      </div>

      {payslips.length === 0 ? (
        <EmptyState
          title="No Payslips Available"
          description="Your payroll statements will be listed here once generated and published by the HR team."
        />
      ) : (
        <div className="table-container card">
          <table>
            <thead>
              <tr>
                <th>Pay Period / Batch</th>
                <th>Payment Date</th>
                <th>Gross Earnings</th>
                <th>Net Take-Home Pay</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payslips.map((slip) => (
                <tr key={slip._id}>
                  <td>
                    <span className="font-semibold">{slip.payrun?.name || 'Monthly Payroll Batch'}</span>
                  </td>
                  <td>{formatDate(slip.paymentDate || slip.createdAt)}</td>
                  <td>₹{(slip.grossPay || 0).toLocaleString('en-IN')}</td>
                  <td>
                    <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>
                      ₹{(slip.netPay || 0).toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td>{renderStateBadge(slip.state)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleViewPayslip(slip._id)}
                    >
                      🖨️ View &amp; Print PDF Payslip
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Official Printable Payslip PDF Modal */}
      <PayslipDetailModal
        isOpen={!!selectedPayslip}
        onClose={() => setSelectedPayslip(null)}
        payslip={selectedPayslip}
      />
    </div>
  );
};

export default EmployeePayrollPage;
