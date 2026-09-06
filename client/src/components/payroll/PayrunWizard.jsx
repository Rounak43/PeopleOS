/**
 * PeopleOS — Create Payrun Wizard Modal
 */
import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { getEmployees } from '../../services/hr/employeeService';
import { getSalaryStructures } from '../../services/payroll/salaryStructureService';
import { createPayrun, computePayrun, getAllPayslips } from '../../services/payroll/payrunService';

const PayrunWizard = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [periodStart, setPeriodStart] = useState('2026-09-01');
  const [periodEnd, setPeriodEnd] = useState('2026-09-30');
  const [selectedStructureId, setSelectedStructureId] = useState('');
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);
  const [alreadyPaidEmpIds, setAlreadyPaidEmpIds] = useState([]);

  // Data lists
  const [employees, setEmployees] = useState([]);
  const [structures, setStructures] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError(null);
      setName('September 2026 Payrun');
      setPeriodStart('2026-09-01');
      setPeriodEnd('2026-09-30');
      setAlreadyPaidEmpIds([]);
      setSearchQuery('');
      fetchInitialData();
    }
  }, [isOpen]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [empRes, structRes] = await Promise.allSettled([
        getEmployees({ limit: 500 }),
        getSalaryStructures(),
      ]);

      if (empRes.status === 'fulfilled') {
        const raw = empRes.value?.data || empRes.value?.items || empRes.value || [];
        const empList = Array.isArray(raw) ? raw : [];
        setEmployees(empList);
        setSelectedEmpIds(empList.map((e) => e._id || e.id));
      }

      if (structRes.status === 'fulfilled') {
        const raw = structRes.value?.data || structRes.value || [];
        const structList = Array.isArray(raw) ? raw : [];
        setStructures(structList);
        if (structList.length > 0) {
          setSelectedStructureId(structList[0]._id || structList[0].id);
        }
      }
    } catch {
      setError('Failed to load initial form data');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const q = searchQuery.toLowerCase().trim();
    return employees.filter((emp) => {
      const name = (emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`).toLowerCase();
      const code = (emp.employeeCode || emp.code || '').toLowerCase();
      const email = (emp.email || '').toLowerCase();
      return name.includes(q) || code.includes(q) || email.includes(q);
    });
  }, [employees, searchQuery]);

  const eligibleFilteredCount = useMemo(() => {
    return filteredEmployees.filter((emp) => !alreadyPaidEmpIds.includes(emp._id || emp.id)).length;
  }, [filteredEmployees, alreadyPaidEmpIds]);

  const handleToggleSelectAll = (e) => {
    if (e.target.checked) {
      const eligible = filteredEmployees
        .map((emp) => emp._id || emp.id)
        .filter((id) => !alreadyPaidEmpIds.includes(id));
      setSelectedEmpIds(eligible);
    } else {
      setSelectedEmpIds([]);
    }
  };

  const handleToggleEmp = (id) => {
    if (alreadyPaidEmpIds.includes(id)) return; // prevent selecting already paid employees
    setSelectedEmpIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!periodStart || !periodEnd) {
        setError('Period Start and End dates are required');
        return;
      }
      setError(null);
      setLoading(true);

      try {
        // Query existing payslips to flag employees already paid for this overlapping period
        const res = await getAllPayslips({
          periodStart,
          periodEnd,
          state: 'Paid,Validated',
          limit: 500,
        });
        const allSlips = res?.data?.items || res?.items || res?.data || res || [];

        const start = new Date(periodStart);
        const end = new Date(periodEnd);

        const paidIds = (Array.isArray(allSlips) ? allSlips : [])
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

        // Pre-select only employees who have not been paid yet
        const eligible = employees
          .map((e) => e._id || e.id)
          .filter((id) => !paidIds.includes(id));

        setSelectedEmpIds(eligible);
        setStep(2);
      } catch {
        setStep(2);
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      if (selectedEmpIds.length === 0) {
        setError('Please select at least one eligible employee for the payrun');
        return;
      }
      setError(null);
      setStep(3);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: name || `Payrun ${periodStart} to ${periodEnd}`,
        periodStart,
        periodEnd,
        salaryStructureId: selectedStructureId || undefined,
        employeeIds: selectedEmpIds,
      };

      const res = await createPayrun(payload);
      const createdData = res?.data || res;
      const payrunObj = createdData.payrun || createdData;

      // Automatically compute payrun so payslips are immediately generated
      if (payrunObj && (payrunObj._id || payrunObj.id)) {
        const pId = payrunObj._id || payrunObj.id;
        await computePayrun(pId);
      }

      onSuccess(payrunObj);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create payrun');
    } finally {
      setLoading(false);
    }
  };

  const selectedStructureName =
    structures.find((s) => (s._id || s.id) === selectedStructureId)?.name || 'Default Monthly Structure';

  const eligibleCount = employees.length - alreadyPaidEmpIds.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Create Payrun — Step ${step} of 3`}
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <div>
            {step > 1 && (
              <Button variant="secondary" onClick={() => setStep(step - 1)} disabled={loading}>
                Back
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            {step < 3 ? (
              <Button variant="primary" onClick={handleNext} loading={loading}>
                Next Step →
              </Button>
            ) : (
              <Button variant="primary" onClick={handleCreate} loading={loading}>
                Create Payrun
              </Button>
            )}
          </div>
        </div>
      }
    >
      {error && (
        <div
          style={{
            background: '#fef2f2',
            color: '#dc2626',
            padding: '10px 14px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}

      {/* Step 1: Period & Structure */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Payrun Title / Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. September 2026 Payrun"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              type="date"
              label="Period Start"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              required
            />
            <Input
              type="date"
              label="Period End"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Salary Structure
            </label>
            <select
              className="payroll-select-filter"
              style={{ width: '100%' }}
              value={selectedStructureId}
              onChange={(e) => setSelectedStructureId(e.target.value)}
            >
              {structures.map((s) => (
                <option key={s._id || s.id} value={s._id || s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Step 2: Employee Selection */}
      {step === 2 && (
        <div>
          {/* Search Box */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder="🔍 Search employee by Name, Email, or Employee Code (e.g. OS26...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>
            {searchQuery && (
              <Button variant="secondary" onClick={() => setSearchQuery('')} style={{ fontSize: '12px', padding: '6px 12px' }}>
                Clear
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Selected Employees ({selectedEmpIds.length} selected {searchQuery ? `out of ${filteredEmployees.length} matching` : ''})
            </span>
            <label style={{ fontSize: '13px', cursor: eligibleFilteredCount > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="checkbox"
                checked={selectedEmpIds.length === eligibleFilteredCount && eligibleFilteredCount > 0}
                disabled={eligibleFilteredCount === 0}
                onChange={handleToggleSelectAll}
              />
              Select All Eligible ({eligibleFilteredCount} Pending)
            </label>
          </div>

          {employees.length > 0 && eligibleCount === 0 && (
            <div style={{ background: '#f1f5f9', color: '#475569', padding: '12px 16px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', border: '1px solid #cbd5e1' }}>
              ℹ️ All active employees have already received salary for the period ({periodStart} — {periodEnd}). No pending unpaid employees.
            </div>
          )}

          <div className="payroll-table-wrapper" style={{ maxHeight: '320px', overflowY: 'auto' }}>
            <table className="payroll-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Emp Code</th>
                  <th>Employee Name</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Period Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                      No employees match "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const empId = emp._id || emp.id;
                    const isPaidForPeriod = alreadyPaidEmpIds.includes(empId);
                    const isChecked = selectedEmpIds.includes(empId);

                    return (
                      <tr
                        key={empId}
                        onClick={() => !isPaidForPeriod && handleToggleEmp(empId)}
                        style={{
                          cursor: isPaidForPeriod ? 'not-allowed' : 'pointer',
                          opacity: isPaidForPeriod ? 0.6 : 1,
                          background: isPaidForPeriod ? '#f8fafc' : 'transparent',
                        }}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isPaidForPeriod}
                            onChange={() => {}}
                          />
                        </td>
                        <td><strong>{emp.employeeCode || emp.code || '—'}</strong></td>
                        <td>{emp.fullName || `${emp.firstName} ${emp.lastName}`}</td>
                        <td>{emp.department?.name || '—'}</td>
                        <td>{emp.jobPosition?.title || emp.jobTitle || '—'}</td>
                        <td>
                          {isPaidForPeriod ? (
                            <span className="badge badge--neutral" style={{ background: '#e2e8f0', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                              ✓ Already Paid for Period
                            </span>
                          ) : (
                            <span className="badge badge--success">
                              Eligible for Pay
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>Payrun Summary Review</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
              <div><strong>Payrun Title:</strong> {name}</div>
              <div><strong>Period:</strong> {periodStart} to {periodEnd}</div>
              <div><strong>Selected Structure:</strong> {selectedStructureName}</div>
              <div><strong>Employees Included:</strong> {selectedEmpIds.length}</div>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
            Once created, the payrun will be in <strong>Draft</strong> state. Click <strong>Compute Payroll</strong> to calculate gross & net salaries. Employees already paid for this period are excluded.
          </p>
        </div>
      )}
    </Modal>
  );
};

export default PayrunWizard;
