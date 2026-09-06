/**
 * PeopleOS — Main HR Payroll Page & Workspace
 * Route: /hr/payroll
 */
import React, { useState, useEffect, useCallback } from 'react';
import PayrollHeader from '../../../components/payroll/PayrollHeader';
import PayrollTabs from '../../../components/payroll/PayrollTabs';
import PayrollOverview from '../../../components/payroll/PayrollOverview';
import PayrunTable from '../../../components/payroll/PayrunTable';
import PayrunDetails from '../../../components/payroll/PayrunDetails';
import PayrunWizard from '../../../components/payroll/PayrunWizard';
import PayslipTable from '../../../components/payroll/PayslipTable';
import PayslipDocument from '../../../components/payroll/PayslipDocument';
import SalaryStructures from '../../../components/payroll/SalaryStructures';
import SalaryRules from '../../../components/payroll/SalaryRules';

import {
  getPayruns,
  getPayrunById,
  computePayrun,
  validatePayrun,
  markPayrunPaid,
  getPayslipById,
  getAllPayslips,
} from '../../../services/payroll/payrunService';

import Modal from '../../../components/common/Modal';
import '../../../components/payroll/Payroll.css';

const HRPayrollPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeConfigTab, setActiveConfigTab] = useState('structures');

  // Main Data States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payruns, setPayruns] = useState([]);
  const [allPayslips, setAllPayslips] = useState([]);

  // Active Selection States
  const [selectedPayrun, setSelectedPayrun] = useState(null);
  const [payrunPayslips, setPayrunPayslips] = useState([]);
  const [loadingPayrunDetails, setLoadingPayrunDetails] = useState(false);

  // Payslip Modal State
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);

  // Payrun Wizard Modal State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);

  // Fetch all payruns & payslips
  const fetchPayruns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [payrunsRes, payslipsRes] = await Promise.allSettled([
        getPayruns({ limit: 100 }),
        getAllPayslips({ limit: 500 }),
      ]);

      if (payrunsRes.status === 'fulfilled') {
        const raw = payrunsRes.value?.data?.items || payrunsRes.value?.items || payrunsRes.value?.data || payrunsRes.value || [];
        setPayruns(Array.isArray(raw) ? raw : []);
      }

      if (payslipsRes.status === 'fulfilled') {
        const raw = payslipsRes.value?.data?.items || payslipsRes.value?.items || payslipsRes.value?.data || payslipsRes.value || [];
        setAllPayslips(Array.isArray(raw) ? raw : []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayruns();
  }, [fetchPayruns]);

  // Load single payrun detail
  const handleSelectPayrun = async (payrun) => {
    const pId = payrun._id || payrun.id;
    setLoadingPayrunDetails(true);
    try {
      const res = await getPayrunById(pId);
      const data = res?.data || res;
      const detailedPayrun = data.payrun || data;
      const fetchedPayslips = data.payslips || detailedPayrun.payslips || [];

      setSelectedPayrun(detailedPayrun);
      setPayrunPayslips(fetchedPayslips);
      setActiveTab('payruns');
    } catch (err) {
      console.error('Failed to load payrun details:', err);
    } finally {
      setLoadingPayrunDetails(false);
    }
  };

  // Open Payslip Document Modal
  const handleViewPayslip = async (payslip) => {
    const psId = payslip._id || payslip.id;
    try {
      const res = await getPayslipById(psId);
      const detailedPs = res?.data || res;
      setSelectedPayslip(detailedPs);
      setIsPayslipModalOpen(true);
    } catch {
      // Fallback to shallow object if detail endpoint fails
      setSelectedPayslip(payslip);
      setIsPayslipModalOpen(true);
    }
  };

  // Lifecycle Actions
  const handleCompute = async (payrunId) => {
    setLoadingAction('compute');
    try {
      await computePayrun(payrunId);
      await fetchPayruns();
      await handleSelectPayrun({ _id: payrunId });
    } catch (err) {
      alert(`Compute error: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleValidate = async (payrunId) => {
    setLoadingAction('validate');
    try {
      await validatePayrun(payrunId);
      await fetchPayruns();
      await handleSelectPayrun({ _id: payrunId });
    } catch (err) {
      alert(`Validation error: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleMarkPaid = async (payrunId) => {
    setLoadingAction('markPaid');
    try {
      await markPayrunPaid(payrunId);
      await fetchPayruns();
      await handleSelectPayrun({ _id: payrunId });
    } catch (err) {
      alert(`Mark paid error: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleWizardSuccess = (newPayrun) => {
    fetchPayruns();
    if (newPayrun) {
      handleSelectPayrun(newPayrun);
    }
  };

  // KPI Calculations
  const latestPayrun = payruns[0];
  const activeEmpCount = latestPayrun?.summary?.employeeCount ?? 0;
  const currentGross = latestPayrun?.summary?.totalGross ?? 0;
  const currentNet = latestPayrun?.summary?.totalNet ?? 0;

  const kpis = {
    totalEmployees: activeEmpCount || '—',
    currentPayrunName: latestPayrun?.name || 'None',
    grossPayroll: currentGross,
    netPayroll: currentNet,
  };

  return (
    <div className="payroll-container">
      {/* Top Header */}
      <PayrollHeader onCreatePayrun={() => setIsWizardOpen(true)} />

      {/* Tabs */}
      <PayrollTabs
        activeTab={activeTab}
        onTabChange={(tab) => {
          setSelectedPayrun(null); // Reset detail view when changing main tabs
          setActiveTab(tab);
        }}
        activeConfigTab={activeConfigTab}
        onConfigTabChange={setActiveConfigTab}
      />

      {error && (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && !selectedPayrun && (
        <PayrollOverview
          kpis={kpis}
          payruns={payruns}
          loading={loading}
          onCreatePayrun={() => setIsWizardOpen(true)}
          onSelectPayrun={handleSelectPayrun}
          onCompute={handleCompute}
          onValidate={handleValidate}
          onMarkPaid={handleMarkPaid}
        />
      )}

      {/* ── Payruns Tab (List or Detail) ── */}
      {activeTab === 'payruns' && (
        selectedPayrun ? (
          <PayrunDetails
            payrun={selectedPayrun}
            payslips={payrunPayslips}
            loadingPayslips={loadingPayrunDetails}
            onBack={() => setSelectedPayrun(null)}
            onCompute={handleCompute}
            onValidate={handleValidate}
            onMarkPaid={handleMarkPaid}
            onViewPayslip={handleViewPayslip}
            loadingAction={loadingAction}
          />
        ) : (
          <PayrunTable
            payruns={payruns}
            loading={loading}
            onSelectPayrun={handleSelectPayrun}
            onCompute={handleCompute}
            onValidate={handleValidate}
            onMarkPaid={handleMarkPaid}
          />
        )
      )}

      {/* ── Payslips Tab ── */}
      {activeTab === 'payslips' && (
        <PayslipTable
          payslips={allPayslips}
          loading={loading}
          onViewPayslip={handleViewPayslip}
        />
      )}

      {/* ── Configuration Tab ── */}
      {activeTab === 'configuration' && (
        activeConfigTab === 'structures' ? (
          <SalaryStructures />
        ) : (
          <SalaryRules />
        )
      )}

      {/* Payrun Wizard Modal */}
      <PayrunWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={handleWizardSuccess}
      />

      {/* Payslip Document Modal */}
      <Modal
        isOpen={isPayslipModalOpen}
        onClose={() => setIsPayslipModalOpen(false)}
        title="Employee Payslip"
        size="lg"
      >
        <PayslipDocument
          payslip={selectedPayslip}
          onClose={() => setIsPayslipModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default HRPayrollPage;
