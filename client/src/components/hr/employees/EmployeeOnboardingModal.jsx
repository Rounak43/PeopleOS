/**
 * PeopleOS — 7-Step Employee Onboarding + Initial Contract Modal
 * Full multi-step onboarding wizard with auto-synced dates, position title tracking, and smart pre-selection.
 */
import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../common/Modal';
import Button from '../../common/Button';
import Input from '../../common/Input';
import Select from '../../common/Select';
import InlineJobPositionSelect from './InlineJobPositionSelect';
import { getDepartments } from '../../../services/hr/departmentService';
import { getEmployees, createEmployee } from '../../../services/hr/employeeService';
import { getSalaryStructures } from '../../../services/hr/salaryStructureService';
import { getWorkingSchedules } from '../../../services/hr/workingScheduleService';
import './EmployeeOnboardingModal.css';

const todayStr = new Date().toISOString().split('T')[0];

const INITIAL_FORM_STATE = {
  // Step 1: Personal Information
  fullName: '',
  email: '',
  phone: '',
  address: '',
  dateJoined: todayStr,
  bankAccountNo: '',
  bankName: '',

  // Step 2: Employment Information
  departmentId: '',
  jobPositionId: '',
  selectedJobPositionObj: null,
  managerId: '',
  status: 'active',

  // Step 3: Contract Information
  startDate: todayStr,
  endDate: '',
  durationType: 'Permanent',

  // Step 4: Compensation
  wage: '',
  wageFrequency: 'Monthly',
  salaryStructureId: '',

  // Step 5: Working Conditions & IT Rules
  scheduleOption: 'default',
  workingScheduleId: '',
  workLocation: 'Hybrid (3 Days Office)',
  probationPeriodMonths: '3',
  noticePeriodDays: '30',
  overtimeAllowed: true,
};

const STEP_LABELS = [
  '1. Personal Info',
  '2. Employment',
  '3. Contract',
  '4. Compensation',
  '5. Schedule',
  '6. Review',
];

const EmployeeOnboardingModal = ({ isOpen, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [stepError, setStepError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generatedEmployeeCode, setGeneratedEmployeeCode] = useState('');

  // Loaded API options
  const [departments, setDepartments] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Reset wizard on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFormData(INITIAL_FORM_STATE);
      setStepError('');
      loadReferenceData();
    }
  }, [isOpen]);

  const loadReferenceData = async () => {
    setLoadingData(true);
    try {
      const [deptRes, empRes, salRes, schedRes] = await Promise.allSettled([
        getDepartments(),
        getEmployees({ limit: 100 }),
        getSalaryStructures(),
        getWorkingSchedules({ limit: 100 }),
      ]);

      let firstDeptId = '';
      if (deptRes.status === 'fulfilled') {
        const items = deptRes.value?.data || deptRes.value || [];
        const deptList = Array.isArray(items) ? items : [];
        setDepartments(deptList);
        if (deptList.length > 0) {
          firstDeptId = deptList[0]._id || deptList[0].id;
        }
      }

      if (empRes.status === 'fulfilled') {
        const items = empRes.value?.data || empRes.value?.items || empRes.value || [];
        setEmployeesList(Array.isArray(items) ? items : []);
      }

      let firstSalId = '';
      if (salRes.status === 'fulfilled') {
        const items = salRes.value?.data || salRes.value || [];
        const salList = Array.isArray(items) ? items : [];
        setSalaryStructures(salList);
        if (salList.length > 0) {
          firstSalId = salList[0]._id || salList[0].id;
        }
      }

      let firstSchedId = '';
      if (schedRes.status === 'fulfilled') {
        const items = schedRes.value?.data || schedRes.value?.items || schedRes.value || [];
        const schedList = Array.isArray(items) ? items : [];
        setSchedules(schedList);
        if (schedList.length > 0) {
          firstSchedId = schedList[0]._id || schedList[0].id;
        }
      }

      // Pre-select default department and salary structure if available
      setFormData((prev) => ({
        ...prev,
        departmentId: prev.departmentId || firstDeptId,
        salaryStructureId: prev.salaryStructureId || firstSalId,
        workingScheduleId: prev.workingScheduleId || firstSchedId,
      }));
    } catch (err) {
      console.error('Error loading reference data for onboarding:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const selectedDepartmentObj = useMemo(() => {
    return departments.find((d) => (d._id || d.id) === formData.departmentId) || null;
  }, [departments, formData.departmentId]);

  const departmentOptions = useMemo(() => {
    return departments.map((d) => ({
      value: d._id || d.id,
      label: d.name,
    }));
  }, [departments]);

  const managerOptions = useMemo(() => {
    return employeesList.map((e) => ({
      value: e._id || e.id,
      label: `${e.fullName || e.name || e.email} (${e.employeeCode || 'EMP'})`,
    }));
  }, [employeesList]);

  const salaryStructureOptions = useMemo(() => {
    if (salaryStructures.length === 0) {
      return [
        { value: 'it_dev_std', label: 'IT Software Engineer Standard Structure (IT_DEV_STD)' },
        { value: 'it_lead_exec', label: 'IT Tech Lead & Engineering Manager Structure (IT_LEAD_EXEC)' },
        { value: 'it_intern', label: 'IT Intern / Trainee Stipend Structure (IT_INTERN)' },
        { value: 'it_sales', label: 'IT Sales & Business Development Structure (IT_SALES)' },
        { value: 'it_ops_supp', label: 'IT Operations & Support Shift Structure (IT_OPS_SUPP)' },
      ];
    }
    return salaryStructures.map((s) => ({
      value: s._id || s.id,
      label: `${s.name} (${s.code || 'STD'})`,
    }));
  }, [salaryStructures]);

  const scheduleOptions = useMemo(() => {
    if (schedules.length === 0) {
      return [
        { value: 'morning_shift', label: 'Morning Shift (Mon-Fri, 9:00 AM - 6:00 PM - 40h/week)' },
        { value: 'evening_shift', label: 'Evening Shift (Mon-Fri, 2:00 PM - 11:00 PM - 40h/week)' },
        { value: 'night_shift', label: 'Night Shift (Mon-Fri, 10:00 PM - 7:00 AM - 40h/week)' },
        { value: 'parttime_shift', label: 'Part-Time Hourly Shift (Mon-Fri, 10:00 AM - 2:00 PM - Paid Per Hr)' },
      ];
    }
    return schedules.map((s) => ({
      value: s._id || s.id,
      label: `${s.name} (${s.totalWeeklyHours || 40}h/week)`,
    }));
  }, [schedules]);

  // Handle Date Joined Change — Auto sync Contract Start Date
  const handleDateJoinedChange = (newDate) => {
    setFormData((prev) => ({
      ...prev,
      dateJoined: newDate,
      startDate: prev.startDate === prev.dateJoined || !prev.startDate ? newDate : prev.startDate,
    }));
    setStepError('');
  };

  // Handle Department Change — reset job position
  const handleDepartmentChange = (newDeptId) => {
    setFormData((prev) => ({
      ...prev,
      departmentId: newDeptId,
      jobPositionId: '',
      selectedJobPositionObj: null,
    }));
    setStepError('');
  };

  // Handle Duration Type Change — Auto calculate end date for fixed term/intern
  const handleDurationTypeChange = (newType) => {
    setFormData((prev) => {
      let newEndDate = prev.endDate;
      if (newType === 'Permanent' || newType === 'Part-time') {
        newEndDate = '';
      } else if (newType === 'Fixed Term' && !prev.endDate) {
        const start = prev.startDate ? new Date(prev.startDate) : new Date();
        start.setFullYear(start.getFullYear() + 1);
        newEndDate = start.toISOString().split('T')[0];
      } else if (newType === 'Intern' && !prev.endDate) {
        const start = prev.startDate ? new Date(prev.startDate) : new Date();
        start.setMonth(start.getMonth() + 6);
        newEndDate = start.toISOString().split('T')[0];
      }
      return {
        ...prev,
        durationType: newType,
        endDate: newEndDate,
      };
    });
    setStepError('');
  };

  // Step Validation
  const validateStep = (step) => {
    setStepError('');
    if (step === 1) {
      if (!formData.fullName.trim()) {
        setStepError('Full Name is required.');
        return false;
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        setStepError('Valid Email Address is required.');
        return false;
      }
      if (!formData.dateJoined) {
        setStepError('Date Joined is required.');
        return false;
      }
    } else if (step === 2) {
      if (!formData.departmentId) {
        setStepError('Department selection is required.');
        return false;
      }
      if (!formData.jobPositionId) {
        setStepError('Job Position selection is required.');
        return false;
      }
    } else if (step === 3) {
      if (!formData.startDate) {
        setStepError('Contract Start Date is required.');
        return false;
      }
      if ((formData.durationType === 'Fixed Term' || formData.durationType === 'Intern') && !formData.endDate) {
        setStepError(`End Date is required for ${formData.durationType} contract duration.`);
        return false;
      }
      if (
        formData.endDate &&
        new Date(formData.endDate) <= new Date(formData.startDate)
      ) {
        setStepError('Contract End Date must be after Start Date.');
        return false;
      }
    } else if (step === 4) {
      if (!formData.wage || Number(formData.wage) <= 0) {
        setStepError('Valid positive Wage amount is required.');
        return false;
      }
      if (!formData.salaryStructureId) {
        setStepError('Salary Structure selection is required.');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 6));
    }
  };

  const handlePrevStep = () => {
    setStepError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Step 6 Submission
  const handleSubmitOnboarding = async () => {
    setSubmitting(true);
    setStepError('');
    setGeneratedEmployeeCode('');

    // NOTE: employeeCode is intentionally NOT included in payload.
    // The backend generates it atomically using the OSYYDDNNN format.
    const payload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
      address: formData.address.trim() || undefined,
      dateJoined: formData.dateJoined,
      departmentId: formData.departmentId,
      jobPositionId: formData.jobPositionId,
      managerId: formData.managerId || null,
      status: formData.status,
      bankDetails: {
        accountNo: formData.bankAccountNo.trim(),
        bankName: formData.bankName.trim(),
      },
      contract: {
        startDate: formData.startDate,
        endDate: formData.durationType === 'Permanent' ? null : formData.endDate || null,
        durationType: formData.durationType,
        wage: Number(formData.wage),
        wageFrequency: formData.wageFrequency,
        salaryStructureId: formData.salaryStructureId,
        workingScheduleId:
          formData.scheduleOption === 'override' && formData.workingScheduleId
            ? formData.workingScheduleId
            : null,
        workLocation: formData.workLocation,
        probationPeriodMonths: Number(formData.probationPeriodMonths),
        noticePeriodDays: Number(formData.noticePeriodDays),
        overtimeAllowed: formData.overtimeAllowed,
      },
    };

    try {
      const result = await createEmployee(payload);
      // Surface the backend-generated employee code
      const code = result?.data?.employeeCode || result?.employeeCode || '';
      setGeneratedEmployeeCode(code);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setStepError(err.message || 'Failed to complete employee onboarding.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSalaryStructureObj = useMemo(() => {
    return salaryStructures.find((s) => (s._id || s.id) === formData.salaryStructureId);
  }, [salaryStructures, formData.salaryStructureId]);

  const selectedScheduleObj = useMemo(() => {
    return schedules.find((s) => (s._id || s.id) === formData.workingScheduleId);
  }, [schedules, formData.workingScheduleId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Employee Onboarding Workflow"
      size="lg"
    >
      <div className="onboarding-wizard">
        {/* Step Progress Bar */}
        <div className="wizard-progress-bar">
          {STEP_LABELS.map((label, idx) => {
            const stepNum = idx + 1;
            const isActive = stepNum === currentStep;
            const isCompleted = stepNum < currentStep;

            return (
              <div
                key={label}
                className={`progress-step-item ${isActive ? 'active' : ''} ${
                  isCompleted ? 'completed' : ''
                }`}
                onClick={() => {
                  if (stepNum < currentStep) setCurrentStep(stepNum);
                }}
              >
                <div className="step-circle">{isCompleted ? '✓' : stepNum}</div>
                <span className="step-label">{label}</span>
              </div>
            );
          })}
        </div>

        {/* Global Error Banner */}
        {stepError && <div className="onboarding-alert-danger">{stepError}</div>}

        {/* Step Content Panels */}
        <div className="wizard-content-panel">
          {/* ──────────────── STEP 1: PERSONAL INFO ──────────────── */}
          {currentStep === 1 && (
            <div className="step-panel">
              <h3 className="step-section-title">Step 1: Personal Information</h3>
              <p className="step-section-subtitle">
                Enter core personal and identification details for the new employee.
              </p>

              <div className="form-grid">
                <Input
                  id="onboard-fullname"
                  label="Full Name"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
                <Input
                  id="onboard-email"
                  type="email"
                  label="Email Address"
                  required
                  placeholder="rahul@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-grid">
                <Input
                  id="onboard-phone"
                  label="Phone Number"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Input
                  id="onboard-datejoined"
                  type="date"
                  label="Date Joined"
                  required
                  value={formData.dateJoined}
                  onChange={(e) => handleDateJoinedChange(e.target.value)}
                />
              </div>

              <div className="form-grid">
                <div className="po-readonly-field">
                  <label className="po-readonly-label">Employee ID</label>
                  <div className="po-readonly-value">
                    <span className="po-id-badge">🔒 Auto-generated by PeopleOS</span>
                    <p className="po-id-hint">Format: <code>OSYYDDNNN</code> — e.g. <code>OS26SE001</code></p>
                    <p className="po-id-hint">Generated after selecting Department &amp; Date Joined.</p>
                  </div>
                </div>
                <Input
                  id="onboard-address"
                  label="Address"
                  placeholder="Full resident address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="form-sub-section">
                <h4 className="sub-section-header">Bank Account Details (Optional)</h4>
                <div className="form-grid">
                  <Input
                    id="onboard-bankacc"
                    label="Bank Account Number"
                    placeholder="e.g. 987654321012"
                    value={formData.bankAccountNo}
                    onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })}
                  />
                  <Input
                    id="onboard-bankname"
                    label="Bank Name"
                    placeholder="e.g. HDFC Bank"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 2: EMPLOYMENT ──────────────── */}
          {currentStep === 2 && (
            <div className="step-panel">
              <h3 className="step-section-title">Step 2: Employment Information</h3>
              <p className="step-section-subtitle">
                Assign the employee's department, job position, manager, and active status.
              </p>

              <div className="form-grid">
                <Select
                  id="onboard-dept"
                  label="Department"
                  required
                  options={departmentOptions}
                  value={formData.departmentId}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  placeholder="Select Department..."
                />

                <InlineJobPositionSelect
                  departmentId={formData.departmentId}
                  departmentName={selectedDepartmentObj?.name || ''}
                  value={formData.jobPositionId}
                  onChange={(posId, posObj) => {
                    setFormData((prev) => ({
                      ...prev,
                      jobPositionId: posId,
                      selectedJobPositionObj: posObj || null,
                    }));
                    setStepError('');
                  }}
                  disabled={!formData.departmentId}
                />
              </div>

              <div className="form-grid">
                <Select
                  id="onboard-manager"
                  label="Reporting Manager"
                  options={managerOptions}
                  value={formData.managerId}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  placeholder="Select Reporting Manager (Optional)..."
                />

                <Select
                  id="onboard-status"
                  label="Employee Status"
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                  ]}
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* ──────────────── STEP 3: CONTRACT ──────────────── */}
          {currentStep === 3 && (
            <div className="step-panel">
              <h3 className="step-section-title">Step 3: Contract Information</h3>
              <p className="step-section-subtitle">
                Configure initial employment contract dates and duration model.
              </p>

              <div className="form-grid">
                <Select
                  id="onboard-durationtype"
                  label="Duration Type"
                  required
                  options={[
                    { value: 'Permanent', label: 'Permanent' },
                    { value: 'Intern', label: 'Intern' },
                    { value: 'Part-time', label: 'Part-time' },
                    { value: 'Fixed Term', label: 'Fixed Term' },
                  ]}
                  value={formData.durationType}
                  onChange={(e) => handleDurationTypeChange(e.target.value)}
                />

                <Input
                  id="onboard-startdate"
                  type="date"
                  label="Contract Start Date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div className="form-grid margin-top-md">
                <Input
                  id="onboard-enddate"
                  type="date"
                  label={
                    formData.durationType === 'Permanent'
                      ? 'Contract End Date (Optional / Open-Ended)'
                      : 'Contract End Date'
                  }
                  required={formData.durationType === 'Fixed Term' || formData.durationType === 'Intern'}
                  placeholder="Select Contract End Date..."
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* ──────────────── STEP 4: COMPENSATION ──────────────── */}
          {currentStep === 4 && (
            <div className="step-panel">
              <h3 className="step-section-title">Step 4: Compensation</h3>
              <p className="step-section-subtitle">
                Define contract base wage, frequency, and applicable salary structure.
              </p>

              <div className="form-grid">
                <Input
                  id="onboard-wage"
                  type="number"
                  label="Wage Amount"
                  required
                  min="0"
                  placeholder="e.g. 50000"
                  value={formData.wage}
                  onChange={(e) => setFormData({ ...formData, wage: e.target.value })}
                />

                <Select
                  id="onboard-frequency"
                  label="Wage Frequency"
                  required
                  options={[
                    { value: 'Monthly', label: 'Monthly' },
                    { value: 'Bi-weekly', label: 'Bi-weekly' },
                    { value: 'Hourly', label: 'Hourly (Per-Hour Basis)' },
                  ]}
                  value={formData.wageFrequency}
                  onChange={(e) => setFormData({ ...formData, wageFrequency: e.target.value })}
                />
              </div>

              <div className="form-grid">
                <Select
                  id="onboard-salarystructure"
                  label="Salary Structure"
                  required
                  options={salaryStructureOptions}
                  value={formData.salaryStructureId}
                  onChange={(e) => setFormData({ ...formData, salaryStructureId: e.target.value })}
                  placeholder="Select Salary Structure..."
                />
              </div>

              <div className="compensation-info-box">
                💡 <strong>Hourly / Working-Hour Basis Note:</strong>
                <p>
                  Contract compensation defines base wage. Payroll automatically calculates hourly rates and overtime based on working schedule hours and actual recorded attendance.
                </p>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 5: WORKING CONDITIONS & IT RULES ──────────────── */}
          {currentStep === 5 && (
            <div className="step-panel">
              <h3 className="step-section-title">Step 5: Working Conditions &amp; IT Rules</h3>
              <p className="step-section-subtitle">
                Configure work location mode, shift schedule, probation rules, and notice periods.
              </p>

              {/* Work Location Mode & Probation */}
              <div className="form-grid">
                <Select
                  id="onboard-worklocation"
                  label="Work Location / Mode"
                  required
                  options={[
                    { value: 'Hybrid (3 Days Office)', label: 'Hybrid (3 Days Office / 2 Days WFH)' },
                    { value: 'On-site (Full Office)', label: 'On-site (Full Office)' },
                    { value: 'Full Remote (WFH)', label: 'Full Remote (Work From Home)' },
                  ]}
                  value={formData.workLocation}
                  onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
                />

                <Select
                  id="onboard-probation"
                  label="Probation Period"
                  options={[
                    { value: '3', label: '3 Months (Standard Tech Probation)' },
                    { value: '6', label: '6 Months (Senior / Manager Probation)' },
                    { value: '0', label: '0 Months (No Probation / Direct)' },
                  ]}
                  value={formData.probationPeriodMonths}
                  onChange={(e) => setFormData({ ...formData, probationPeriodMonths: e.target.value })}
                />
              </div>

              <div className="form-grid">
                <Select
                  id="onboard-noticeperiod"
                  label="Notice Period Policy"
                  options={[
                    { value: '30', label: '30 Days (Standard Notice)' },
                    { value: '60', label: '60 Days' },
                    { value: '90', label: '90 Days (Tech Lead / Executive)' },
                  ]}
                  value={formData.noticePeriodDays}
                  onChange={(e) => setFormData({ ...formData, noticePeriodDays: e.target.value })}
                />
              </div>

              {/* Schedule Selection */}
              <div className="schedule-option-selector margin-top-md">
                <label className="radio-option-card">
                  <input
                    type="radio"
                    name="scheduleOption"
                    value="default"
                    checked={formData.scheduleOption === 'default'}
                    onChange={() => setFormData({ ...formData, scheduleOption: 'default', workingScheduleId: '' })}
                  />
                  <div>
                    <strong>Use Organization Default IT Shift</strong>
                    <p className="text-muted text-sm">
                      Standard 40-hour Weekly Schedule (Mon-Fri 9:00 AM - 6:00 PM).
                    </p>
                  </div>
                </label>

                <label className="radio-option-card">
                  <input
                    type="radio"
                    name="scheduleOption"
                    value="override"
                    checked={formData.scheduleOption === 'override'}
                    onChange={() => setFormData({ ...formData, scheduleOption: 'override' })}
                  />
                  <div>
                    <strong>Select Contract Shift Override</strong>
                    <p className="text-muted text-sm">
                      Assign Flexible Core Hours, US Night Support Shift, or Part-Time schedule.
                    </p>
                  </div>
                </label>
              </div>

              {formData.scheduleOption === 'override' && (
                <div className="form-grid margin-top-md">
                  <Select
                    id="onboard-workingschedule"
                    label="Working Schedule Override"
                    options={scheduleOptions}
                    value={formData.workingScheduleId}
                    onChange={(e) => setFormData({ ...formData, workingScheduleId: e.target.value })}
                    placeholder="Select Working Schedule..."
                  />
                </div>
              )}
            </div>
          )}

          {/* ──────────────── STEP 6: REVIEW ──────────────── */}
          {currentStep === 6 && (
            <div className="step-panel">
              <h3 className="step-section-title">Step 6: Review Onboarding Summary</h3>
              <p className="step-section-subtitle">
                Please review all information before creating the employee record and initial contract.
              </p>

              <div className="review-cards-container">
                {/* Personal Info Review */}
                <div className="review-card">
                  <div className="review-card-header">
                    <h4>1. Personal Information</h4>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                      Edit ✏️
                    </Button>
                  </div>
                  <div className="review-grid">
                    <div><strong>Full Name:</strong> {formData.fullName}</div>
                    <div><strong>Email:</strong> {formData.email}</div>
                    <div><strong>Phone:</strong> {formData.phone || '—'}</div>
                    <div><strong>Date Joined:</strong> {formData.dateJoined}</div>
                    <div><strong>Employee ID:</strong> <span className="po-id-badge-sm">🔒 Auto-generated by PeopleOS (OSYYDDNNN)</span></div>
                    <div><strong>Bank:</strong> {formData.bankName ? `${formData.bankName} (${formData.bankAccountNo})` : '—'}</div>
                  </div>
                </div>

                {/* Employment Review */}
                <div className="review-card">
                  <div className="review-card-header">
                    <h4>2. Employment Details</h4>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>
                      Edit ✏️
                    </Button>
                  </div>
                  <div className="review-grid">
                    <div><strong>Department:</strong> {selectedDepartmentObj?.name || '—'}</div>
                    <div><strong>Job Position:</strong> {formData.selectedJobPositionObj?.title || '—'}</div>
                    <div><strong>Manager:</strong> {formData.managerId ? managerOptions.find(m => m.value === formData.managerId)?.label : 'None'}</div>
                    <div><strong>Status:</strong> {formData.status.toUpperCase()}</div>
                  </div>
                </div>

                {/* Contract Review */}
                <div className="review-card">
                  <div className="review-card-header">
                    <h4>3. Contract Details</h4>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(3)}>
                      Edit ✏️
                    </Button>
                  </div>
                  <div className="review-grid">
                    <div><strong>Duration Type:</strong> {formData.durationType}</div>
                    <div><strong>Contract Start Date:</strong> {formData.startDate}</div>
                    <div><strong>Contract End Date:</strong> {formData.endDate || '— (Open-Ended / Permanent)'}</div>
                  </div>
                </div>

                {/* Compensation Review */}
                <div className="review-card">
                  <div className="review-card-header">
                    <h4>4. Compensation</h4>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(4)}>
                      Edit ✏️
                    </Button>
                  </div>
                  <div className="review-grid">
                    <div><strong>Wage:</strong> ₹{Number(formData.wage).toLocaleString()}</div>
                    <div><strong>Frequency:</strong> {formData.wageFrequency}</div>
                    <div><strong>Salary Structure:</strong> {selectedSalaryStructureObj?.name || 'Standard Structure'}</div>
                  </div>
                </div>

                {/* Working Conditions Review */}
                <div className="review-card">
                  <div className="review-card-header">
                    <h4>5. Working Conditions &amp; IT Rules</h4>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(5)}>
                      Edit ✏️
                    </Button>
                  </div>
                  <div className="review-grid">
                    <div><strong>Work Location:</strong> {formData.workLocation}</div>
                    <div><strong>Probation Period:</strong> {formData.probationPeriodMonths === '0' ? 'None' : `${formData.probationPeriodMonths} Months`}</div>
                    <div><strong>Notice Period:</strong> {formData.noticePeriodDays} Days</div>
                    <div>
                      <strong>Working Schedule:</strong>{' '}
                      {formData.scheduleOption === 'override' && selectedScheduleObj
                        ? selectedScheduleObj.name
                        : 'Standard Tech Shift (40h/week)'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation Actions */}
        <div className="wizard-actions-footer">
          {currentStep > 1 && (
            <Button variant="secondary" onClick={handlePrevStep} disabled={submitting}>
              ← Back
            </Button>
          )}

          <div className="margin-left-auto flex gap-sm">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>

            {currentStep < 6 ? (
              <Button variant="primary" onClick={handleNextStep}>
                Next Step →
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmitOnboarding}
                loading={submitting}
              >
                Create Employee & Contract 🎉
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EmployeeOnboardingModal;
