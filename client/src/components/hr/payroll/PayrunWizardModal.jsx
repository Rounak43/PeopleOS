/**
 * PeopleOS — Step-by-Step Payrun Creation Wizard Modal
 * Step 1: Define Payrun Name, Start Date, End Date
 * Step 2: Employee Selection with Bulk Select & Active Contract Badges
 * Step 3: Compute Payslips & Finalize Payrun Batch
 */
import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../common/Modal';
import Button from '../../common/Button';
import Input from '../../common/Input';
import Select from '../../common/Select';
import Loading from '../../common/Loading';
import ErrorMessage from '../../common/ErrorMessage';
import { getEmployees } from '../../../services/hr/employeeService';
import { createPayrunBatch, getAllPayslips } from '../../../services/payroll/payrunService';
import './PayrunWizardModal.css';

const PayrunWizardModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1, 2, 3
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 State
  const [payrunName, setPayrunName] = useState(`Monthly Payrun — ${new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' })}`);
  const [periodStart, setPeriodStart] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [periodEnd, setPeriodEnd] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10));

  // Step 2 State
  const [employees, setEmployees] = useState([]);
  const [alreadyPaidEmpIds, setAlreadyPaidEmpIds] = useState([]);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);
  const [searchEmp, setSearchEmp] = useState('');

  // Step 3 State
  const [computedResult, setComputedResult] = useState(null);

  // Fetch employees and check period paid status on step 2
  useEffect(() => {
    if (step === 2) {
      const loadStaff = async () => {
        setFetchingEmployees(true);
        try {
          const [empRes, payslipsRes] = await Promise.allSettled([
            getEmployees({ limit: 500 }),
            getAllPayslips({ periodStart, periodEnd, state: 'Paid,Validated', limit: 500 }),
          ]);

          let activeList = [];
          if (empRes.status === 'fulfilled') {
            const list = empRes.value?.data || empRes.value?.items || empRes.value || [];
            activeList = Array.isArray(list) ? list.filter((e) => (e.status || 'active') === 'active') : [];
            setEmployees(activeList);
          }

          let paidIds = [];
          if (payslipsRes.status === 'fulfilled') {
            const slips = payslipsRes.value?.data?.items || payslipsRes.value?.items || payslipsRes.value?.data || payslipsRes.value || [];
            const start = new Date(periodStart);
            const end = new Date(periodEnd);

            paidIds = (Array.isArray(slips) ? slips : [])
              .filter((ps) => {
                if (!['Paid', 'Validated'].includes(ps.state)) return false;
                const psStart = new Date(ps.periodStart);
                const psEnd = new Date(ps.periodEnd);
                return psStart <= end && psEnd >= start;
              })
              .map((ps) => {
                const emp = ps.employee;
                return typeof emp === 'object' ? emp?._id || emp?.id : emp;
              })
              .filter(Boolean);

            setAlreadyPaidEmpIds(paidIds);
          }

          // Pre-select employees who have NOT been paid yet for this period
          const eligibleIds = activeList
            .map((e) => e._id || e.id)
            .filter((id) => !paidIds.includes(id));
          setSelectedEmpIds(eligibleIds);
        } catch (err) {
          setError('Failed to load eligible employee records');
        } finally {
          setFetchingEmployees(false);
        }
      };
      loadStaff();
    }
  }, [step, periodStart, periodEnd]);

  const filteredEmployees = useMemo(() => {
    if (!searchEmp.trim()) return employees;
    const q = searchEmp.toLowerCase();
    return employees.filter(
      (e) =>
        (e.fullName || `${e.firstName || ''} ${e.lastName || ''}`).toLowerCase().includes(q) ||
        (e.employeeCode || '').toLowerCase().includes(q) ||
        (e.email || '').toLowerCase().includes(q)
    );
  }, [employees, searchEmp]);

  const eligibleFilteredEmployees = useMemo(() => {
    return filteredEmployees.filter((emp) => !alreadyPaidEmpIds.includes(emp._id || emp.id));
  }, [filteredEmployees, alreadyPaidEmpIds]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedEmpIds(eligibleFilteredEmployees.map((emp) => emp._id || emp.id));
    } else {
      setSelectedEmpIds([]);
    }
  };

  const handleToggleEmp = (id) => {
    if (alreadyPaidEmpIds.includes(id)) return; // Prevent selecting already paid staff
    setSelectedEmpIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Step 1 -> Step 2
  const handleStep1Next = (e) => {
    e.preventDefault();
    if (!payrunName.trim() || !periodStart || !periodEnd) {
      setError('Please provide Payrun Name, Start Date, and End Date');
      return;
    }
    setError('');
    setStep(2);
  };

  // Step 2 -> Step 3 (Compute Payrun API Call)
  const handleComputePayrun = async () => {
    if (selectedEmpIds.length === 0) {
      setError('Please select at least 1 employee to include in this payrun');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await createPayrunBatch({
        name: payrunName,
        periodStart,
        periodEnd,
        employeeIds: selectedEmpIds,
      });

      const data = res?.data || res;
      setComputedResult(data);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Failed to compute payrun batch');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Step-by-Step Payrun Creation Wizard"
      size="lg"
    >
      <div className="payrun-wizard-container">
        {/* Step Indicator Header */}
        <div className="wizard-step-tracker">
          <div className={`step-item ${step >= 1 ? 'active' : ''}`}>
            <span className="step-num">1</span>
            <span className="step-label">Scope &amp; Period</span>
          </div>
          <div className="step-line" />
          <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
            <span className="step-num">2</span>
            <span className="step-label">Select Staff</span>
          </div>
          <div className="step-line" />
          <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
            <span className="step-num">3</span>
            <span className="step-label">Compute &amp; Finalize</span>
          </div>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* STEP 1: Scope & Dates */}
        {step === 1 && (
          <form onSubmit={handleStep1Next} className="wizard-step-body">
            <h4 className="wizard-subtitle">Step 1: Define Pay Period &amp; Batch Scope</h4>
            
            <Input
              id="wizard-name"
              label="Payrun Batch Name"
              required
              value={payrunName}
              onChange={(e) => setPayrunName(e.target.value)}
              placeholder="e.g. September 2026 Monthly Payroll"
            />

            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
              <Input
                id="wizard-start"
                type="date"
                label="Period Start Date"
                required
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
              <Input
                id="wizard-end"
                type="date"
                label="Period End Date"
                required
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>

            <div className="wizard-info-card">
              <span>ℹ️ Payrun Engine will evaluate active contract terms and attendance for the selected date range.</span>
            </div>

            <div className="modal-form-actions margin-top-md">
              <Button variant="secondary" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Continue to Employee Selection →
              </Button>
            </div>
          </form>
        )}

        {/* STEP 2: Select Employees */}
        {step === 2 && (
          <div className="wizard-step-body">
            <div className="wizard-step2-header">
              <div>
                <h4 className="wizard-subtitle">Step 2: Select Eligible Staff ({selectedEmpIds.length} Selected)</h4>
                <p className="text-muted text-sm">Include staff members in this monthly salary processing batch</p>
              </div>
              <Input
                id="wizard-emp-search"
                placeholder="Search staff..."
                value={searchEmp}
                onChange={(e) => setSearchEmp(e.target.value)}
                style={{ width: '220px' }}
              />
            </div>

            {fetchingEmployees ? (
              <Loading message="Loading active employee contracts and period payment status..." />
            ) : (
              <div className="wizard-staff-frame">
                <div className="wizard-staff-toolbar">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={
                        selectedEmpIds.length === eligibleFilteredEmployees.length &&
                        eligibleFilteredEmployees.length > 0
                      }
                      onChange={handleSelectAll}
                      disabled={eligibleFilteredEmployees.length === 0}
                    />
                    <strong>Select All Eligible ({eligibleFilteredEmployees.length} Pending)</strong>
                  </label>
                  <span className="selected-count-pill">{selectedEmpIds.length} Selected</span>
                </div>

                {employees.length > 0 && eligibleFilteredEmployees.length === 0 && (
                  <div style={{ background: '#f1f5f9', color: '#475569', padding: '12px 16px', margin: '12px 12px 0 12px', borderRadius: '8px', fontSize: '13px', border: '1px solid #cbd5e1' }}>
                    ℹ️ All active employees have already received salary for the period ({periodStart} — {periodEnd}). No pending unpaid employees.
                  </div>
                )}

                <div className="staff-checklist-scroll">
                  {filteredEmployees.map((emp) => {
                    const empId = emp._id || emp.id;
                    const isAlreadyPaid = alreadyPaidEmpIds.includes(empId);
                    const isChecked = selectedEmpIds.includes(empId);
                    const fullName = emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`;

                    return (
                      <label
                        key={empId}
                        className={`staff-checklist-row ${isChecked ? 'selected' : ''} ${isAlreadyPaid ? 'already-paid-row' : ''}`}
                        style={{
                          opacity: isAlreadyPaid ? 0.6 : 1,
                          cursor: isAlreadyPaid ? 'not-allowed' : 'pointer',
                          background: isAlreadyPaid ? '#f8fafc' : undefined,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isAlreadyPaid}
                          onChange={() => handleToggleEmp(empId)}
                        />
                        <span className="emp-avatar-icon">👤</span>
                        <div className="staff-info-block">
                          <span className="staff-name">{fullName}</span>
                          <span className="staff-sub">{emp.email} • {emp.employeeCode}</span>
                        </div>
                        {isAlreadyPaid ? (
                          <span className="badge badge-neutral" style={{ background: '#e2e8f0', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                            ✓ ALREADY PAID (PERIOD COVERED)
                          </span>
                        ) : (
                          <span className="badge badge-success">
                            ELIGIBLE (UNPAID)
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="modal-form-actions margin-top-md">
              <Button variant="secondary" type="button" onClick={() => setStep(1)} disabled={loading}>
                ← Back
              </Button>
              <Button variant="primary" type="button" loading={loading} onClick={handleComputePayrun}>
                ⚙️ Calculate Payslips &amp; Generate Batch
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Compute & Finalize */}
        {step === 3 && computedResult && (
          <div className="wizard-step-body">
            <div className="compute-success-banner">
              <span className="banner-icon">🎉</span>
              <div>
                <h4>Payrun Batch Generated Successfully!</h4>
                <p>Created <strong>{computedResult.payslipsCount || computedResult.payslips?.length || 0}</strong> verified payslips for <strong>{payrunName}</strong>.</p>
              </div>
            </div>

            <div className="summary-stats-box">
              <div className="stat-item">
                <span>Batch Name:</span>
                <strong>{payrunName}</strong>
              </div>
              <div className="stat-item">
                <span>Period:</span>
                <strong>{periodStart} to {periodEnd}</strong>
              </div>
              <div className="stat-item">
                <span>Staff Count:</span>
                <strong>{computedResult.payslipsCount || computedResult.payslips?.length} Employees</strong>
              </div>
              <div className="stat-item">
                <span>Status:</span>
                <span className="badge badge-warning">PROCESSING</span>
              </div>
            </div>

            <div className="modal-form-actions margin-top-md">
              <Button variant="primary" type="button" onClick={handleFinish}>
                ✓ Complete &amp; View Payrun Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PayrunWizardModal;
