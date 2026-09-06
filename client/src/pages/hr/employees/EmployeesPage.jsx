/**
 * PeopleOS — Employee Management Page
 * Route: /hr/employees
 *
 * Features:
 * - Framed table layout with sticky header
 * - Sequenced ascending sorting (EMP-101 -> EMP-300)
 * - Rows selector dropdown: 10, 25, 50, 100, Show All (200+)
 * - Pagination controls & active count statistics
 * - Clean department badge formatting
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
import EmployeeOnboardingModal from '../../../components/hr/employees/EmployeeOnboardingModal';
import {
  getEmployees,
  updateEmployee,
  deleteEmployee,
} from '../../../services/hr/employeeService';
import { getDepartments } from '../../../services/hr/departmentService';
import { exportEmployeesToExcel } from '../../../utils/excelExport';
import './page.css';

const EmployeesPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Display Controls
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const selectedDeptParam = searchParams.get('department') || '';
  const [departmentFilter, setDepartmentFilter] = useState(selectedDeptParam);
  const [statusFilter, setStatusFilter] = useState('');

  // Sync state if URL search param changes
  useEffect(() => {
    if (selectedDeptParam !== departmentFilter) {
      setDepartmentFilter(selectedDeptParam);
      setCurrentPage(1);
    }
  }, [selectedDeptParam]);

  // Modals
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick Edit Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    departmentId: '',
    status: 'active',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Employees & Departments from API
  const fetchEmployeeData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const limitVal = pageSize === 'ALL' ? 500 : Number(pageSize);
      const params = {
        page: currentPage,
        limit: limitVal,
        search: searchQuery.trim(),
        departmentId: departmentFilter,
        status: statusFilter,
      };

      const [empRes, deptRes] = await Promise.allSettled([
        getEmployees(params),
        getDepartments(),
      ]);

      if (empRes.status === 'fulfilled') {
        const rawEmps = empRes.value?.data || empRes.value?.items || empRes.value || [];
        setEmployees(Array.isArray(rawEmps) ? rawEmps : []);
        setTotalItems(empRes.value?.pagination?.total || (Array.isArray(rawEmps) ? rawEmps.length : 0));
        setTotalPages(empRes.value?.pagination?.totalPages || 1);
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
  }, [currentPage, pageSize, searchQuery, departmentFilter, statusFilter]);

  useEffect(() => {
    fetchEmployeeData();
  }, [fetchEmployeeData]);

  // Clean department display helper (strips timestamp suffixes if any)
  const cleanDeptName = (name) => {
    if (!name) return 'General';
    return name.split('_')[0].trim();
  };

  // Department select options for filter
  const departmentOptions = useMemo(() => {
    return departments.map((d) => ({
      value: d._id || d.id || d.name,
      label: cleanDeptName(d.name),
    }));
  }, [departments]);

  // Open Edit Form
  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      fullName: emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || '',
      email: emp.email || '',
      phone: emp.phone || '',
      departmentId: emp.departmentId?._id || emp.departmentId || '',
      status: emp.status || emp.employmentStatus || 'active',
    });
    setFormError('');
    setIsFormModalOpen(true);
  };

  // Edit Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      setFormError('Full Name and Email are required.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id || editingEmployee._id, formData);
      }
      setIsFormModalOpen(false);
      await fetchEmployeeData();
    } catch (err) {
      setFormError(err.message || 'Failed to update employee record.');
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
    setCurrentPage(1);
    setSearchParams({});
  };

  return (
    <div className="module-page employees-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Employees Directory</h2>
          <p className="page-subtitle">Centralized employee records, role assignments, and HR profile hub</p>
        </div>
        <div className="flex gap-sm">
          <Button variant="secondary" onClick={fetchEmployeeData} disabled={loading}>
            🔄 Refresh
          </Button>
          <Button
            variant="secondary"
            onClick={() => exportEmployeesToExcel(filteredEmployees.length > 0 ? filteredEmployees : employees)}
            disabled={loading || employees.length === 0}
            title="Download employee directory as an organized Excel file"
          >
            📊 Export Excel
          </Button>
          <Button variant="primary" onClick={() => setIsOnboardingModalOpen(true)}>
            + Add Employee
          </Button>
        </div>
      </div>

      {/* Toolbar / Filters & Rows Selector */}
      <div className="filters-toolbar card">
        <div className="search-box">
          <Input
            id="emp-search"
            placeholder="Search by employee name, email, Employee ID (e.g. OS26DS010), or position..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="filter-dropdowns">
          <Select
            id="dept-filter"
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setCurrentPage(1);
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
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'terminated', label: 'Terminated' },
            ]}
            placeholder="All Statuses"
          />

          {/* Rows Limit Selector */}
          <div className="rows-limit-wrapper">
            <span className="rows-limit-label">Show:</span>
            <select
              className="rows-limit-select"
              value={pageSize}
              onChange={(e) => {
                const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                setPageSize(val);
                setCurrentPage(1);
              }}
            >
              <option value={10}>10 rows</option>
              <option value={25}>25 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
              <option value="ALL">Show All (200+)</option>
            </select>
          </div>

          {(searchQuery || departmentFilter || statusFilter) && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <Loading message="Loading employee records in sequence..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchEmployeeData} />
      ) : employees.length === 0 ? (
        <EmptyState
          title="No employees found"
          description="No employee records matched your active search or filters."
          action={{ label: 'Add Employee', onClick: () => setIsOnboardingModalOpen(true) }}
        />
      ) : (
        <div className="table-container-card card">
          {/* Table Header Controls Bar */}
          <div className="table-meta-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="meta-sequence-pill">
                <span>🔢 Format:</span> <strong>OSYYDDNNN (e.g. OS26DS010)</strong>
              </div>

              {/* Kanban / List View Toggle Button */}
              <div className="view-toggle-group">
                <button
                  type="button"
                  className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="Table List View"
                >
                  📋 List View
                </button>
                <button
                  type="button"
                  className={`view-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                  onClick={() => setViewMode('kanban')}
                  title="Kanban Card View"
                >
                  📇 Kanban View
                </button>
              </div>
            </div>

            <div className="meta-stats-text">
              Showing <strong>{employees.length}</strong> of <strong>{totalItems || employees.length}</strong> Employees
              {pageSize !== 'ALL' && totalPages > 1 && (
                <span> (Page {currentPage} of {totalPages})</span>
              )}
            </div>
          </div>

          {/* Conditional View Rendering: Framed Data Table VS Kanban Card Grid */}
          {viewMode === 'list' ? (
            <div className="table-scroll-frame">
              <table className="employees-data-table">
                <thead>
                  <tr>
                    <th style={{ width: '22%' }}>Employee</th>
                    <th style={{ width: '12%' }}>Employee Code</th>
                    <th style={{ width: '18%' }}>Department</th>
                    <th style={{ width: '18%' }}>Job Position</th>
                    <th style={{ width: '10%' }}>Schedule</th>
                    <th style={{ width: '8%' }}>Status</th>
                    <th style={{ width: '12%', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => {
                    const fullName =
                      emp.fullName ||
                      (emp.firstName && emp.lastName ? `${emp.firstName} ${emp.lastName}` : emp.name || emp.email);
                    const empCode = emp.employeeCode || emp.id || emp._id || 'OS26DS000';
                    const deptRaw = emp.departmentId?.name || emp.department || 'General';
                    const deptName = cleanDeptName(deptRaw);
                    const jobTitle = emp.jobPositionId?.title || emp.jobTitle || emp.position || 'Staff';
                    const scheduleName = emp.workingScheduleId?.name ? emp.workingScheduleId.name.split('(')[0].trim() : 'Standard Shift';
                    const empStatus = emp.status || emp.employmentStatus || 'active';

                    return (
                      <tr key={emp._id || emp.id || emp.email}>
                        <td>
                          <div className="employee-cell">
                            <span className="emp-avatar-icon">👤</span>
                            <div className="emp-name-block">
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
                          <span className="emp-id-tag">{empCode}</span>
                        </td>
                        <td>
                          <span className="dept-code-tag" title={deptName}>
                            {deptName}
                          </span>
                        </td>
                        <td>
                          <span className="job-title-text" title={jobTitle}>{jobTitle}</span>
                        </td>
                        <td>
                          <span className="schedule-text">{scheduleName}</span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              empStatus === 'active'
                                ? 'badge-success'
                                : empStatus === 'inactive'
                                ? 'badge-warning'
                                : 'badge-danger'
                            }`}
                          >
                            {empStatus.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="actions-cell">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingEmployee(emp)}
                            >
                              View
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
                              onClick={() => setDeletingId(emp._id || emp.id)}
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
          ) : (
            <div className="kanban-grid-container">
              {employees.map((emp) => {
                const fullName =
                  emp.fullName ||
                  (emp.firstName && emp.lastName ? `${emp.firstName} ${emp.lastName}` : emp.name || emp.email);
                const empCode = emp.employeeCode || emp.id || emp._id || 'EMP-N/A';
                const deptRaw = emp.departmentId?.name || emp.department || 'General';
                const deptName = cleanDeptName(deptRaw);
                const jobTitle = emp.jobPositionId?.title || emp.jobTitle || emp.position || 'Staff';
                const scheduleName = emp.workingScheduleId?.name ? emp.workingScheduleId.name.split('(')[0].trim() : 'Standard Shift';
                const empStatus = emp.status || emp.employmentStatus || 'active';

                return (
                  <div key={emp._id || emp.id || emp.email} className="employee-kanban-card">
                    <div className="kanban-card-header">
                      <div className="kanban-user-info">
                        <div className="kanban-avatar">👤</div>
                        <div className="kanban-title-block">
                          <button
                            className="kanban-emp-name"
                            onClick={() => setViewingEmployee(emp)}
                          >
                            {fullName}
                          </button>
                          <span className="kanban-emp-email">{emp.email}</span>
                        </div>
                      </div>
                      <span
                        className={`badge ${
                          empStatus === 'active'
                            ? 'badge-success'
                            : empStatus === 'inactive'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                      >
                        {empStatus.toUpperCase()}
                      </span>
                    </div>

                    <div className="kanban-card-body">
                      <div className="kanban-info-row">
                        <span className="kanban-info-label">Code:</span>
                        <span className="emp-id-tag">{empCode}</span>
                      </div>
                      <div className="kanban-info-row">
                        <span className="kanban-info-label">Dept:</span>
                        <span className="dept-code-tag">{deptName}</span>
                      </div>
                      <div className="kanban-info-row">
                        <span className="kanban-info-label">Role:</span>
                        <span className="job-title-text">{jobTitle}</span>
                      </div>
                      <div className="kanban-info-row">
                        <span className="kanban-info-label">Shift:</span>
                        <span className="schedule-text">{scheduleName}</span>
                      </div>
                    </div>

                    <div className="kanban-card-actions">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingEmployee(emp)}
                      >
                        View
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
                        onClick={() => setDeletingId(emp._id || emp.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Table Footer Pagination controls */}
          {pageSize !== 'ALL' && totalPages > 1 && (
            <div className="table-pagination-footer">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage <= 1 || loading}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              >
                ← Previous Page
              </Button>

              <div className="pagination-page-numbers">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 7 && currentPage > 4) {
                    pageNum = currentPage - 3 + i;
                  }
                  if (pageNum > totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      className={`page-num-btn ${pageNum === currentPage ? 'active' : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage >= totalPages || loading}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              >
                Next Page →
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 7-Step Professional Onboarding Modal */}
      <EmployeeOnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        onSuccess={fetchEmployeeData}
      />

      {/* Edit Employee Quick Modal */}
      {isFormModalOpen && (
        <Modal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          title="Edit Employee Record"
          size="md"
        >
          <form onSubmit={handleFormSubmit}>
            {formError && <div className="form-error-alert">{formError}</div>}

            <Input
              id="emp-edit-fullname"
              label="Full Name"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />

            <Input
              id="emp-edit-email"
              type="email"
              label="Email Address"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <Input
              id="emp-edit-phone"
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <Select
              id="emp-edit-status"
              label="Employee Status"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'terminated', label: 'Terminated' },
              ]}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            />

            <div className="modal-form-actions margin-top-md">
              <Button
                variant="secondary"
                onClick={() => setIsFormModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Employee Details Modal View */}
      {viewingEmployee && (
        <Modal
          isOpen={Boolean(viewingEmployee)}
          onClose={() => setViewingEmployee(null)}
          title={`Employee Profile — ${
            viewingEmployee.fullName || viewingEmployee.name || viewingEmployee.email
          }`}
          size="lg"
        >
          <div className="employee-profile-card">
            <div className="profile-header-block">
              <span className="profile-avatar-lg">👤</span>
              <div>
                <h3>
                  {viewingEmployee.fullName || viewingEmployee.name || viewingEmployee.email}
                </h3>
                <p className="text-muted text-sm">
                  {viewingEmployee.jobPositionId?.title || viewingEmployee.jobTitle || 'Staff'} •{' '}
                  <span className="dept-code-tag">
                    {cleanDeptName(viewingEmployee.departmentId?.name || viewingEmployee.department)}
                  </span>
                </p>
                <span
                  className={`badge ${
                    (viewingEmployee.status || viewingEmployee.employmentStatus) === 'active'
                      ? 'badge-success'
                      : 'badge-warning'
                  }`}
                >
                  {(viewingEmployee.status || viewingEmployee.employmentStatus || 'active').toUpperCase()}
                </span>
              </div>
            </div>

            <div className="profile-sections">
              <div className="profile-section">
                <h4>Contact &amp; Basic Info</h4>
                <div className="detail-row">
                  <strong>Employee Code:</strong>
                  <span>{viewingEmployee.employeeCode || viewingEmployee._id || 'N/A'}</span>
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
                  <span>
                    {viewingEmployee.dateJoined
                      ? new Date(viewingEmployee.dateJoined).toISOString().slice(0, 10)
                      : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="profile-section">
                <h4>Employment &amp; HR Assignment</h4>
                <div className="detail-row">
                  <strong>Department:</strong>
                  <span>{cleanDeptName(viewingEmployee.departmentId?.name || viewingEmployee.department)}</span>
                </div>
                <div className="detail-row">
                  <strong>Job Position:</strong>
                  <span>{viewingEmployee.jobPositionId?.title || viewingEmployee.jobTitle || 'Staff'}</span>
                </div>
                <div className="detail-row">
                  <strong>Reporting Manager:</strong>
                  <span>{viewingEmployee.managerId?.fullName || 'Unassigned'}</span>
                </div>
                <div className="detail-row">
                  <strong>Working Schedule:</strong>
                  <span>{viewingEmployee.workingScheduleId?.name || 'Standard Shift'}</span>
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
                  🏖️ Time Off &amp; Leave
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
