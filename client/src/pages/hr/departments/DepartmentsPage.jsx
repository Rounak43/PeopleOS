/**
 * PeopleOS — Department Management Page
 * Route: /hr/departments
 *
 * Consumes existing departmentService.js API layer.
 * Reuses existing Button, Input, Select, Modal, ConfirmDialog, EmptyState, ErrorMessage, Loading components.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Modal from '../../../components/common/Modal';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import EmptyState from '../../../components/common/EmptyState';
import ErrorMessage from '../../../components/common/ErrorMessage';
import Loading from '../../../components/common/Loading';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../../../services/hr/departmentService';
import { getEmployees } from '../../../services/hr/employeeService';
import '../employees/page.css';

const DepartmentsPage = () => {
  const navigate = useNavigate();

  // State
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [viewingDepartment, setViewingDepartment] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    managerName: '',
    status: 'Active',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Departments & Employees from API
  const fetchDepartmentData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [deptRes, empRes] = await Promise.allSettled([
        getDepartments(),
        getEmployees(),
      ]);

      if (deptRes.status === 'fulfilled') {
        const rawDepts = deptRes.value?.data || deptRes.value || [];
        setDepartments(Array.isArray(rawDepts) ? rawDepts : []);
      } else {
        throw deptRes.reason || new Error('Failed to fetch departments from server');
      }

      if (empRes.status === 'fulfilled') {
        const rawEmps = empRes.value?.data || empRes.value || [];
        setEmployees(Array.isArray(rawEmps) ? rawEmps : []);
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to backend department service');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartmentData();
  }, [fetchDepartmentData]);

  // Filtered department list
  const filteredDepartments = departments.filter((dept) => {
    const name = (dept.name || '').toLowerCase();
    const code = (dept.code || '').toLowerCase();
    const manager = (dept.managerName || dept.manager || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      name.includes(query) || code.includes(query) || manager.includes(query);
    const matchesStatus = statusFilter ? dept.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  // Code mapping helper for standard IT departments
  const getDeptCode = (dept) => {
    if (dept.code) return dept.code;
    const name = (dept.name || '').toLowerCase();
    if (name.includes('software') || name.includes('engineering')) return 'ENG-01';
    if (name.includes('product')) return 'PROD-01';
    if (name.includes('devops') || name.includes('cloud')) return 'OPS-01';
    if (name.includes('quality') || name.includes('qa')) return 'QA-01';
    if (name.includes('data')) return 'DATA-01';
    if (name.includes('security') || name.includes('cyber')) return 'SEC-01';
    if (name.includes('sales')) return 'SALES-01';
    if (name.includes('human') || name.includes('hr')) return 'HR-01';
    if (name.includes('finance')) return 'FIN-01';
    return 'DEPT-01';
  };

  // Calculate employee counts per department name/id
  const getDeptEmployees = (dept) => {
    const dId = (dept._id || dept.id || '').toString();
    const dName = (dept.name || '').toLowerCase().split('_')[0].trim();

    return employees.filter((e) => {
      const eDeptId = (e.departmentId?._id || e.departmentId || '').toString();
      const eDeptName = (e.departmentId?.name || e.department || '').toLowerCase().split('_')[0].trim();
      return (dId && eDeptId === dId) || (dName && eDeptName && eDeptName.includes(dName));
    });
  };

  const getDeptEmployeeCount = (dept) => {
    return getDeptEmployees(dept).length;
  };

  // Open Create Form
  const handleOpenCreateModal = () => {
    setEditingDepartment(null);
    setFormData({
      name: '',
      code: '',
      managerEmployeeId: '',
      status: 'Active',
    });
    setFormError('');
    setIsFormModalOpen(true);
  };

  // Open Edit Form
  const handleOpenEditModal = (dept) => {
    setEditingDepartment(dept);
    setFormData({
      name: dept.name || '',
      code: getDeptCode(dept),
      managerEmployeeId: dept.managerEmployeeId?._id || dept.managerEmployeeId || '',
      status: dept.status || 'Active',
    });
    setFormError('');
    setIsFormModalOpen(true);
  };

  // Form Submit (Create or Update)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      setFormError('Department Name is required.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        managerEmployeeId: formData.managerEmployeeId || null,
        status: formData.status,
      };

      if (editingDepartment) {
        await updateDepartment(editingDepartment._id || editingDepartment.id, payload);
      } else {
        await createDepartment(payload);
      }
      setIsFormModalOpen(false);
      await fetchDepartmentData();
    } catch (err) {
      setFormError(err.message || 'Failed to save department.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteDepartment(deletingId);
      setDeletingId(null);
      await fetchDepartmentData();
    } catch (err) {
      alert(err.message || 'Failed to delete department.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="module-page departments-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Departments</h2>
          <p className="page-subtitle">Manage organizational IT business units, managers, and assigned staff</p>
        </div>
        <div className="flex gap-sm">
          <Button variant="secondary" onClick={fetchDepartmentData} disabled={loading}>
            🔄 Refresh
          </Button>
          <Button variant="primary" onClick={handleOpenCreateModal}>
            + Add Department
          </Button>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="filters-toolbar card">
        <div className="search-box">
          <Input
            id="dept-search"
            placeholder="Search by department name, code, or manager..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-dropdowns">
          <Select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
            ]}
            placeholder="All Statuses"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <Loading message="Fetching departments from API..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchDepartmentData} />
      ) : filteredDepartments.length === 0 ? (
        <EmptyState
          title="No departments found"
          description="No department records matched your criteria."
          action={{ label: 'Add Department', onClick: handleOpenCreateModal }}
        />
      ) : (
        <div className="table-container-card card">
          {/* Table Header Controls Bar */}
          <div className="table-meta-bar">
            <div className="meta-sequence-pill">
              <span>🏢 IT Departments:</span> <strong>{filteredDepartments.length} Business Units</strong>
            </div>

            <div className="meta-stats-text">
              Active Management &amp; Employee Members Distribution
            </div>
          </div>

          {/* Framed Data Table */}
          <div className="table-scroll-frame">
            <table className="employees-data-table">
              <thead>
                <tr>
                  <th style={{ width: '28%' }}>Department Name</th>
                  <th style={{ width: '12%' }}>Code</th>
                  <th style={{ width: '28%' }}>Designated Manager</th>
                  <th style={{ width: '16%' }}>Assigned Staff</th>
                  <th style={{ width: '16%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartments.map((dept) => {
                  const empCount = getDeptEmployeeCount(dept);
                  const deptCode = getDeptCode(dept);
                  const manager = dept.managerEmployeeId;
                  const managerName = manager?.fullName || (manager?.firstName ? `${manager.firstName} ${manager.lastName || ''}` : manager?.email);
                  const managerCode = manager?.employeeCode || '';

                  return (
                    <tr key={dept.id || dept._id || dept.code}>
                      <td>
                        <button
                          className="btn-link"
                          onClick={() => setViewingDepartment(dept)}
                        >
                          🏢 {dept.name}
                        </button>
                      </td>
                      <td>
                        <span className="dept-code-tag">{deptCode}</span>
                      </td>
                      <td>
                        {managerName ? (
                          <div className="employee-cell">
                            <span className="emp-avatar-icon">👤</span>
                            <div className="emp-name-block">
                              <span style={{ fontWeight: '600', fontSize: '13px' }}>{managerName}</span>
                              {managerCode && <span className="emp-sub-text">{managerCode}</span>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted text-sm">Unassigned</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn-link"
                          style={{ color: '#0284C7', fontWeight: '700' }}
                          onClick={() =>
                            navigate(`/hr/employees?department=${encodeURIComponent(dept._id || dept.id || dept.name)}`)
                          }
                          title="View employees in department"
                        >
                          👥 {empCount} Members
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="actions-cell">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingDepartment(dept)}
                          >
                            View
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenEditModal(dept)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setDeletingId(dept.id || dept._id)}
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
        </div>
      )}

      {/* Create / Edit Department Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingDepartment ? 'Edit Department' : 'Create Department'}
        size="md"
      >
        <form onSubmit={handleFormSubmit}>
          {formError && <div className="form-error-alert">{formError}</div>}

          <div className="form-grid">
            <Input
              id="dept-name"
              label="Department Name"
              required
              placeholder="e.g. Engineering"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              id="dept-code"
              label="Department Code"
              required
              placeholder="e.g. ENG"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
          </div>

          <div className="form-grid">
            <Select
              id="dept-manager"
              label="Designated Department Manager"
              value={formData.managerEmployeeId}
              onChange={(e) => setFormData({ ...formData, managerEmployeeId: e.target.value })}
              options={employees.map((emp) => ({
                value: emp._id || emp.id,
                label: `${emp.fullName || (emp.firstName && emp.lastName ? `${emp.firstName} ${emp.lastName}` : emp.email)} (${emp.employeeCode || ''})`,
              }))}
              placeholder="Unassigned (Select Manager)"
            />
            <Select
              id="dept-status"
              label="Status"
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
              ]}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
              {editingDepartment ? 'Save Changes' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Department Details Modal */}
      {viewingDepartment && (
        <Modal
          isOpen={Boolean(viewingDepartment)}
          onClose={() => setViewingDepartment(null)}
          title={`Department Details — ${viewingDepartment.name}`}
          size="md"
        >
          <div className="department-detail-card">
            <div className="detail-header-block">
              <span className="dept-icon-lg">🏢</span>
              <div>
                <h3>{viewingDepartment.name}</h3>
                <span className="dept-code-tag">{viewingDepartment.code}</span>
              </div>
            </div>

            <div className="detail-rows">
              <div className="detail-row">
                <strong>Manager:</strong>
                <span>{viewingDepartment.managerName || viewingDepartment.manager || 'Unassigned'}</span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                <span
                  className={`badge ${
                    viewingDepartment.status === 'Active' ? 'badge-success' : 'badge-neutral'
                  }`}
                >
                  {viewingDepartment.status || 'Active'}
                </span>
              </div>
              <div className="detail-row">
                <strong>Total Employees:</strong>
                <span>{getDeptEmployeeCount(viewingDepartment)} Members</span>
              </div>
            </div>

            <div className="dept-members-section">
              <h4>Department Members</h4>
              {getDeptEmployees(viewingDepartment).length === 0 ? (
                <p className="text-muted text-sm">No employees currently assigned to this department.</p>
              ) : (
                <ul className="members-list">
                  {getDeptEmployees(viewingDepartment).map((emp) => (
                    <li key={emp.id || emp._id} className="member-item">
                      <span>👤 {emp.firstName ? `${emp.firstName} ${emp.lastName}` : emp.name || emp.email}</span>
                      <span className="text-muted text-sm">{emp.jobTitle || emp.role || 'Staff'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="modal-form-actions">
              <Button
                variant="secondary"
                onClick={() => {
                  const deptName = viewingDepartment.name;
                  setViewingDepartment(null);
                  navigate(`/hr/employees?department=${encodeURIComponent(deptName)}`);
                }}
              >
                👥 View Employees in Department
              </Button>
              <Button variant="ghost" onClick={() => setViewingDepartment(null)}>
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
        title="Delete Department"
        message="Are you sure you want to delete this department? This action will remove the department record from the system."
        loading={isDeleting}
      />
    </div>
  );
};

export default DepartmentsPage;
