/**
 * PeopleOS — Payslips Page (/payroll/payslips)
 */
import React, { useState, useEffect, useCallback } from 'react';
import PayslipTable from '../../../components/payroll/PayslipTable';
import PayslipDocument from '../../../components/payroll/PayslipDocument';
import Modal from '../../../components/common/Modal';
import { getPayruns, getPayslipById, getMyPayslips, getAllPayslips } from '../../../services/payroll/payrunService';
import useAuth from '../../../hooks/useAuth';

const PayslipsPage = () => {
  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';

  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPayslipData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isEmployee) {
        const res = await getMyPayslips();
        const list = res?.data || res || [];
        setPayslips(Array.isArray(list) ? list : []);
      } else {
        const res = await getAllPayslips({ limit: 500 });
        const list = res?.data?.items || res?.items || res?.data || res || [];
        setPayslips(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      setError(err.message || 'Unable to retrieve payslip records from server.');
    } finally {
      setLoading(false);
    }
  }, [isEmployee]);

  useEffect(() => {
    fetchPayslipData();
  }, [fetchPayslipData]);

  const handleViewPayslip = async (slip) => {
    const psId = slip._id || slip.id;
    try {
      const res = await getPayslipById(psId);
      setSelectedPayslip(res?.data || res);
    } catch {
      setSelectedPayslip(slip);
    }
    setIsModalOpen(true);
  };

  return (
    <div className="payroll-container">
      <div className="payroll-header">
        <div className="payroll-header-info">
          <h1>Employee Payslips</h1>
          <p>
            {isEmployee
              ? 'View and print your official salary statements and deduction breakdowns.'
              : 'Manage and review generated employee payslips.'}
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      <PayslipTable
        payslips={payslips}
        loading={loading}
        onViewPayslip={handleViewPayslip}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Employee Payslip"
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

export default PayslipsPage;
