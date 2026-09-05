/**
 * PeopleOS — Job Positions Page
 * Complete HR Management Module for Job Positions
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  getJobPositions,
  createJobPosition,
  updateJobPosition,
  deleteJobPosition,
} from '../../../services/hr/jobPositionService';
import { getDepartments } from '../../../services/hr/departmentService';

import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Modal from '../../../components/common/Modal';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import Loading from '../../../components/common/Loading';
import EmptyState from '../../../components/common/EmptyState';
import ErrorMessage from '../../../components/common/ErrorMessage';

import './JobPositionsPage.css';

const JobPositionsPage = () => {
  // Data states
  const [jobPositions, setJobPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form & selection states
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [formData, setFormData] = useState({ title: '', departmentId: '' });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Load Departments for Dropdown
  const loadDepartments = useCallback(async () => {
    try {
      const res = await getDepartments();
      const items = res?.data?.items || res?.data || res || [];
      setDepartments(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  }, []);

  // Load Job Positions
  const fetchJobPositions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getJobPositions({
        search,
        departmentId: departmentFilter,
      });
      const items = res?.data?.items || res?.data || [];
      setJobPositions(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err.message || 'Failed to load job positions');
    } finally {
      setLoading(false);
    }
  }, [search, departmentFilter]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    fetchJobPositions();
  }, [fetchJobPositions]);

  // Form Handlers
  const handleOpenCreate = () => {
    setFormData({ title: '', departmentId: '' });
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (position) => {
    setSelectedPosition(position);
    setFormData({
      title: position.title || '',
      departmentId: position.departmentId?._id || position.departmentId || '',
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenView = (position) => {
    setSelectedPosition(position);
    setIsViewModalOpen(true);
  };

  const handleOpenDelete = (position) => {
    setSelectedPosition(position);
    setFormError(null);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.departmentId) {
      setFormError('Position title and department are required');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await createJobPosition(formData);
      setIsCreateModalOpen(false);
      fetchJobPositions();
    } catch (err) {
      setFormError(err.message || 'Failed to create job position');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.departmentId) {
      setFormError('Position title and department are required');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await updateJobPosition(selectedPosition._id, formData);
      setIsEditModalOpen(false);
      fetchJobPositions();
    } catch (err) {
      setFormError(err.message || 'Failed to update job position');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPosition) return;
    setSubmitting(true);
    try {
      await deleteJobPosition(selectedPosition._id);
      setIsDeleteDialogOpen(false);
      fetchJobPositions();
    } catch (err) {
      setError(err.message || 'Unable to delete job position because it is referenced elsewhere.');
      setIsDeleteDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const departmentOptions = [
    { value: '', label: 'All Departments' },
    ...departments.map((dept) => ({
      value: dept._id,
      label: dept.name,
    })),
  ];

  const formDepartmentOptions = [
    { value: '', label: 'Select Department' },
    ...departments.map((dept) => ({
      value: dept._id,
      label: dept.name,
    })),
  ];

  return (
    <div className="job-positions-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Job Positions</h2>
          <p className="page-subtitle">Manage company job roles and titles</p>
        </div>
        <Button variant="primary" onClick={handleOpenCreate}>
          + Add Job Position
        </Button>
      </div>

      {/* Error Alert */}
      {error && <ErrorMessage message={error} onRetry={fetchJobPositions} />}

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Input
            placeholder="Search by position title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-select-wrapper">
          <Select
            options={departmentOptions}
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <Loading message="Loading job positions..." />
      ) : jobPositions.length === 0 ? (
        <EmptyState
          icon="💼"
          title="No job positions found"
          message={search || departmentFilter ? 'No positions match your search criteria.' : 'Get started by creating your first job position.'}
          actionLabel="+ Add Job Position"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Position Title</th>
                <th>Department</th>
                <th style={{ width: '180px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobPositions.map((pos) => (
                <tr key={pos._id}>
                  <td style={{ fontWeight: '600' }}>{pos.title}</td>
                  <td>
                    <span className="dept-badge">
                      {pos.departmentId?.name || 'Unassigned'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Button variant="secondary" size="sm" onClick={() => handleOpenView(pos)}>
                        View
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(pos)}>
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleOpenDelete(pos)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Job Position"
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && <ErrorMessage message={formError} />}
          <Input
            label="Position Title"
            placeholder="e.g. Senior Software Engineer"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <Select
            label="Department"
            options={formDepartmentOptions}
            value={formData.departmentId}
            onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
            required
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Create Position
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Job Position"
      >
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && <ErrorMessage message={formError} />}
          <Input
            label="Position Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <Select
            label="Department"
            options={formDepartmentOptions}
            value={formData.departmentId}
            onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
            required
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Job Position Details"
      >
        {selectedPosition && (
          <div className="details-list">
            <div className="details-item">
              <span className="details-label">Position Title</span>
              <span className="details-value">{selectedPosition.title}</span>
            </div>
            <div className="details-item">
              <span className="details-label">Department</span>
              <span className="details-value">{selectedPosition.departmentId?.name || 'N/A'}</span>
            </div>
            <div className="details-item">
              <span className="details-label">Position ID</span>
              <span className="details-value" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {selectedPosition._id}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Job Position"
        message={`Are you sure you want to delete "${selectedPosition?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Position"
        loading={submitting}
      />
    </div>
  );
};

export default JobPositionsPage;
