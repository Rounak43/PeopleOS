/**
 * PeopleOS — Employee Self-Service Payslips Page (/employee/payroll)
 */
import React, { useState, useEffect, useCallback } from 'react';
import Button from '../../../components/common/Button';
import EmptyState from '../../../components/common/EmptyState';
import Loading from '../../../components/common/Loading';
import Modal from '../../../components/common/Modal';
import PayslipDocument from '../../../components/payroll/PayslipDocument';
import { getPayslips, getPayslipById } from '../../../services/employee/employeePortalService';
import { formatCurrency, formatPeriod, getStatusBadgeClass } from '../../../utils/formatters';
import '../../../components/payroll/Payroll.css';

const EmployeePayrollPage = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPayslipData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPayslips();
      const list = res.data || res;
      setPayslips(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || 'Unable to retrieve your payslip records.');
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
      setIsModalOpen(true);
    } catch {
      const shallow = payslips.find((p) => (p._id || p.id) === payslipId);
      setSelectedPayslip(shallow);
      setIsModalOpen(true);
    }
  };

  if (loading) {
    return <Loading message="Loading your payslips..." />;
  }

  return (
    <div className="payroll-container">
      <div className="payroll-header">
        <div className="payroll-header-info">
          <h1>My Payroll &amp; Payslips</h1>
          <p>Access your official salary statements and tax deduction breakdowns.</p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {payslips.length === 0 ? (
        <div className="payroll-card">
          <EmptyState
            title="No Payslips Available"
            message="Your payroll statements will be listed here once generated and published by HR."
          />
        </div>
      ) : (
        <div className="payroll-card">
          <div className="payroll-table-wrapper">
            <table className="payroll-table">
              <thead>
                <tr>
                  <th>Pay Period</th>
                  <th>Gross Earnings</th>
                  <th>Total Deductions</th>
                  <th>Net Take-Home</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map((slip) => {
                  const slipId = slip._id || slip.id;
                  const gross = slip.grossPay || 0;
                  const deductions = slip.totalDeductions || 0;
                  const net = slip.netPay || (gross - deductions);

                  return (
                    <tr key={slipId} onClick={() => handleViewPayslip(slipId)} style={{ cursor: 'pointer' }}>
                      <td>
                        <strong>{formatPeriod(slip.periodStart, slip.periodEnd)}</strong>
                      </td>
                      <td>{formatCurrency(gross)}</td>
                      <td style={{ color: '#dc2626' }}>{formatCurrency(deductions)}</td>
                      <td>
                        <strong style={{ color: '#ea580c' }}>{formatCurrency(net)}</strong>
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(slip.state || 'Paid')}>
                          {slip.state || 'Paid'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleViewPayslip(slipId)}
                        >
                          🖨️ View Payslip
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Official Salary Statement"
        size="lg"
      >
        <PayslipDocument
          payslip={selectedPayslip}
          onClose={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default EmployeePayrollPage;
