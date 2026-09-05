/**
 * PeopleOS — Employee Management Page
 * Route: /hr/employees
 *
 * Consumes existing employeeService.js and departmentService.js API layers.
 * Reuses existing Button, Input, Select, Modal, ConfirmDialog, EmptyState, ErrorMessage, Loading components.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Modal from '../../../components/common/Modal';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import EmptyState from '../../../components/common/EmptyState';
import ErrorMessage from '../../../components/common/ErrorMessage';
import Loading from '../../../components/common/Loading';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../../../services/hr/employeeService';
import { getDepartments } from '../../../services/hr/departmentService';
import './page.css';

const EmployeesPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const selectedDeptParam = searchParams.get('department') || '';
  const [departmentFilter, setDepartmentFilter] = useState(selectedDeptParam);
  const [statusFilter, setStatusFilter] = useState('');

  // Sync state if URL search param changes
  useEffect(() => {
    if (selectedDeptParam !== departmentFilter) {
      setDepartmentFilter(selectedDeptParam);
    }
  }, [selectedDeptParam]);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    jobTitle: '',
    managerName: '',
    workingSchedule: 'Standard 40h/week',
    employmentStatus: 'Active',
    joinDate: new Date().toISOString().split('T')[0],
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Employees & Departments from API
  const fetchEmployeeData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [empRes, deptRes] = await Promise.allSettled([
        getEmployees(),
        getDepartments(),
      ]);

      if (empRes.status === 'fulfilled') {
        const rawEmps = empRes.value?.data || empRes.value || [];
        setEmployees(Array.isArray(rawEmps) ? rawEmps : []);
      } else {
        throw empRes.reason || new Error('Failed to fetch employees from server');
      }

      if (deptRes.status === 'fulfilled') {
        const rawDepts = deptRes.value?.data || deptRes.value || [];
        setDepartments(Array.isArray(rawDepts) ? rawDepts : []);
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to backend employee service');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployeeData();
  }, [fetchEmployeeData]);

  // Filtered employee list
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const firstName = emp.firstName || '';
      const lastName = emp.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim() || emp.name || '';
      const email = emp.email || '';
      const jobTitle = emp.jobTitle || emp.position || '';
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        fullName.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        jobTitle.toLowerCase().includes(query);

      const matchesDept = departmentFilter
        ? emp.department === departmentFilter || emp.departmentId === departmentFilter
        : true;

      const matchesStatus = statusFilter
        ? (emp.employmentStatus || emp.status) === statusFilter
        : true;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, searchQuery, departmentFilter, statusFilter]);

  // Department select options
  const departmentOptions = useMemo(() => {
    return departments.map((d) => ({
      value: d.name || d.id,
      label: d.name,
    }));
  }, [departments]);

  // Open Create Form
  const handleOpenCreateModal = () => {
    setEditingEmployee(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: departmentOptions[0]?.value || '',
      jobTitle: '',
      managerName: '',
      workingSchedule: 'Standard 40h/week',
      employmentStatus: 'Active',
      joinDate: new Date().toISOString().split('T')[0],
    });
    setFormError('');
    setIsFormModalOpen(true);
  };

  // Open Edit Form
  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      firstName: emp.firstName || emp.name?.split(' ')[0] || '',
      lastName: emp.lastName || emp.name?.split(' ').slice(1).join(' ') || '',
      email: emp.email || '',
      phone: emp.phone || '',
      department: emp.department || '',
      jobTitle: emp.jobTitle || emp.position || '',
      managerName: emp.managerName || emp.manager || '',
      workingSchedule: emp.workingSchedule || 'Standard 40h/week',
      employmentStatus: emp.employmentStatus || emp.status || 'Active',
      joinDate: emp.joinDate || emp.joiningDate || new Date().toISOString().split('T')[0],
    });
    setFormError('');
    setIsFormModalOpen(true);
  };

  // Form Submit (Create or Edit)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.email || !formData.jobTitle) {
      setFormError('First Name, Email, and Job Title are required.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id || editingEmployee._id, formData);
      } else {
        await createEmployee(formData);
      }
      setIsFormModalOpen(false);
      await fetchEmployeeData();
    } catch (err) {
      setFormError(err.message || 'Failed to save employee. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteEmployee(deletingId);
      setDeletingId(null);
      await fetchEmployeeData();
    } catch (err) {
      alert(err.message || 'Failed to delete employee.');
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDepartmentFilter('');
    setStatusFilter('');
    setSearchParams({});
  };

  return (
    <div className="module-page employees-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Employees</h2>
          <p className="page-subtitle">Centralized employee records and HR information hub</p>
        </div>
        <div className="flex gap-sm">
          <Button variant="secondary" onClick={fetchEmployeeData} disabled={loading}>
            🔄 Refresh
          </Button>
          <Button variant="primary" onClick={handleOpenCreateModal}>
            + Add Employee
          </Button>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="filters-toolbar card">
        <div className="search-box">
          <Input
            id="emp-search"
            placeholder="Search by employee name, email, or job title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-dropdowns">
          <Select
            id="dept-filter"
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              if (e.target.value) {
                setSearchParams({ department: e.target.value });
              } else {
                setSearchParams({});
              }
            }}
            options={departmentOptions}
            placeholder="All Departments"
          />
          <Select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'On Leave', label: 'On Leave' },
              { value: 'Terminated', label: 'Terminated' },
            ]}
            placeholder="All Statuses"
          />
          {(searchQuery || departmentFilter || statusFilter) && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <Loading message="Fetching employees from API..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchEmployeeData} />
      ) : filteredEmployees.length === 0 ? (
        <EmptyState
          title="No employees found"
          description="No employee records matched your active search or filters."
          action={{ label: 'Add Employee', onClick: handleOpenCreateModal }}
        />
      ) : (
        <div className="table-container card">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Job Position</th>
                <th>Schedule</th>
                <th>Status</th>
                <th>Join Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => {
                const fullName =
                  emp.firstName && emp.lastName
                    ? `${emp.firstName} ${emp.lastName}`
                    : emp.name || emp.email;
                const empStatus = emp.employmentStatus || emp.status || 'Active';

                return (
                  <tr key={emp.id || emp._id || emp.email}>
                    <td>
                      <div className="employee-cell">
                        <span className="emp-avatar-icon">👤</span>
                        <div>
                          <button
                            className="btn-link"
                            onClick={() => setViewingEmployee(emp)}
                          >
                            {fullName}
                          </button>
                          <div className="emp-sub-text">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="emp-id-tag">{emp.id || emp._id || 'EMP-N/A'}</span>
                    </td>
                    <td>
                      <span className="dept-code-tag">{emp.department || 'General'}</span>
                    </td>
                    <td>{emp.jobTitle || emp.position || 'Staff'}</td>
                    <td>{emp.workingSchedule || 'Standard'}</td>
                    <td>
                      <span
                        className={`badge ${
                          empStatus === 'Active'
                            ? 'badge-success'
                            : empStatus === 'On Leave'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                      >
                        {empStatus}
                      </span>
                    </td>
                    <td>{emp.joinDate || emp.joiningDate || 'N/A'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingEmployee(emp)}
                        >
                          View Profile
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenEditModal(emp)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDeletingId(emp.id || emp._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Employee Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingEmployee ? 'Edit Employee Record' : 'Add New Employee'}
        size="lg"
      >
        <form onSubmit={handleFormSubmit}>
          {formError && <div className="form-error-alert">{formError}</div>}

          <div className="form-grid">
            <Input
              id="emp-first-name"
              label="First Name"
              required
              placeholder="e.g. John"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
            <Input
              id="emp-last-name"
              label="Last Name"
              placeholder="e.g. Doe"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </div>

          <div className="form-grid">
            <Input
              id="emp-email"
              type="email"
              label="Email Address"
              required
              placeholder="john.doe@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              id="emp-phone"
              label="Phone Number"
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="form-grid">
            <Select
              id="emp-dept"
              label="Department"
              options={departmentOptions}
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="Select Department"
            />
            <Input
              id="emp-job-title"
              label="Job Position"
              required
              placeholder="e.g. Senior Software Engineer"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
            />
          </div>

          <div className="form-grid">
            <Input
              id="emp-manager"
              label="Reporting Manager"
              placeholder="e.g. Sarah Connor"
              value={formData.managerName}
              onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
            />
            <Input
              id="emp-schedule"
              label="Working Schedule"
              placeholder="e.g. Standard 40h/week"
              value={formData.workingSchedule}
              onChange={(e) => setFormData({ ...formData, workingSchedule: e.target.value })}
            />
          </div>

          <div className="form-grid">
            <Select
              id="emp-status"
              label="Employment Status"
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'On Leave', label: 'On Leave' },
                { value: 'Terminated', label: 'Terminated' },
              ]}
              value={formData.employmentStatus}
              onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value })}
            />
            <Input
              id="emp-join-date"
              type="date"
              label="Joining Date"
              value={formData.joinDate}
              onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
            />
          </div>

          <div className="modal-form-actions">
            <Button
              variant="secondary"
              onClick={() => setIsFormModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isSubmitting}>
              {editingEmployee ? 'Save Changes' : 'Create Employee'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Employee Details Modal View */}
      {viewingEmployee && (
        <Modal
          isOpen={Boolean(viewingEmployee)}
          onClose={() => setViewingEmployee(null)}
          title={`Employee Profile — ${
            viewingEmployee.firstName
              ? `${viewingEmployee.firstName} ${viewingEmployee.lastName}`
              : viewingEmployee.name || viewingEmployee.email
          }`}
          size="lg"
        >
          <div className="employee-profile-card">
            <div className="profile-header-block">
              <span className="profile-avatar-lg">👤</span>
              <div>
                <h3>
                  {viewingEmployee.firstName
                    ? `${viewingEmployee.firstName} ${viewingEmployee.lastName}`
                    : viewingEmployee.name || viewingEmployee.email}
                </h3>
                <p className="text-muted text-sm">
                  {viewingEmployee.jobTitle || viewingEmployee.position || 'Staff'} •{' '}
                  <span className="dept-code-tag">
                    {viewingEmployee.department || 'General'}
                  </span>
                </p>
                <span
                  className={`badge ${
                    (viewingEmployee.employmentStatus || viewingEmployee.status) === 'Active'
                      ? 'badge-success'
                      : 'badge-warning'
                  }`}
                >
                  {viewingEmployee.employmentStatus || viewingEmployee.status || 'Active'}
                </span>
              </div>
            </div>

            <div className="profile-sections">
              <div className="profile-section">
                <h4>Contact & Basic Info</h4>
                <div className="detail-row">
                  <strong>Employee ID:</strong>
                  <span>{viewingEmployee.id || viewingEmployee._id || 'EMP-N/A'}</span>
                </div>
                <div className="detail-row">
                  <strong>Email Address:</strong>
                  <span>{viewingEmployee.email || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <strong>Phone Number:</strong>
                  <span>{viewingEmployee.phone || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <strong>Joining Date:</strong>
                  <span>{viewingEmployee.joinDate || viewingEmployee.joiningDate || 'N/A'}</span>
                </div>
              </div>

              <div className="profile-section">
                <h4>Employment & HR Assignment</h4>
                <div className="detail-row">
                  <strong>Department:</strong>
                  <span>{viewingEmployee.department || 'Unassigned'}</span>
                </div>
                <div className="detail-row">
                  <strong>Job Position:</strong>
                  <span>{viewingEmployee.jobTitle || viewingEmployee.position || 'Staff'}</span>
                </div>
                <div className="detail-row">
                  <strong>Reporting Manager:</strong>
                  <span>{viewingEmployee.managerName || viewingEmployee.manager || 'Unassigned'}</span>
                </div>
                <div className="detail-row">
                  <strong>Working Schedule:</strong>
                  <span>{viewingEmployee.workingSchedule || 'Standard'}</span>
                </div>
              </div>
            </div>

            {/* Smart Module Navigation Links */}
            <div className="profile-modules-hub">
              <h4>HR Related Records Shortcuts</h4>
              <div className="hub-buttons">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setViewingEmployee(null);
                    navigate('/hr/contracts');
                  }}
                >
                  📄 View Contracts
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setViewingEmployee(null);
                    navigate('/hr/attendance');
                  }}
                >
                  ⏱️ Attendance Records
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setViewingEmployee(null);
                    navigate('/hr/time-off');
                  }}
                >
                  🏖️ Time Off & Leave
                </Button>
              </div>
            </div>

            <div className="modal-form-actions">
              <Button variant="ghost" onClick={() => setViewingEmployee(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Employee Record"
        message="Are you sure you want to delete this employee record? This action will remove the employee from the HR database."
        loading={isDeleting}
      />
    </div>
  );
};

export default EmployeesPage;
