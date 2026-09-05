/**
 * PeopleOS — Employee Leave Management Page
 * Route: /employee/leave
 *
 * Displays leave allocations, submission form modal for time-off requests,
 * and time-off request history with real-time statuses.
 * Reuses existing Modal, Input, Select, Button, EmptyState, Loading, ErrorMessage components.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Modal from '../../../components/common/Modal';
import EmptyState from '../../../components/common/EmptyState';
import ErrorMessage from '../../../components/common/ErrorMessage';
import Loading from '../../../components/common/Loading';
import {
  getLeaveOverview,
  submitLeaveRequest,
} from '../../../services/employee/employeePortalService';
import '../employee.css';

const EmployeeLeavePage = () => {
  const [leaveData, setLeaveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Request Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    timeOffTypeId: '',
    dateFrom: '',
    dateTo: '',
    reason: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLeaveOverview();
      const payload = res.data || res;
      setLeaveData(payload);
    } catch (err) {
      console.error('Failed to load leave data:', err);
      setError(err.message || 'Unable to retrieve leave allocations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleOpenModal = () => {
    const defaultTypeId = leaveData?.leaveTypes?.[0]?._id || leaveData?.allocations?.[0]?.timeOffTypeId?._id || '';
    setFormData({
      timeOffTypeId: defaultTypeId,
      dateFrom: new Date().toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
      reason: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!formData.timeOffTypeId || !formData.dateFrom || !formData.dateTo) {
      setFormError('Please select a leave type, start date, and end date.');
      return;
    }

    if (new Date(formData.dateTo) < new Date(formData.dateFrom)) {
      setFormError('End date cannot be earlier than start date.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      await submitLeaveRequest(formData);
      setSubmitSuccess('Leave request submitted successfully for approval.');
      setIsModalOpen(false);
      await fetchLeaves();
      setTimeout(() => setSubmitSuccess(''), 5000);
    } catch (err) {
      setFormError(err.message || 'Failed to submit leave request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <Loading message="Loading leave allocations..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchLeaves} />;
  }

  const { allocations = [], requests = [], leaveTypes = [] } = leaveData || {};

  const typeOptions = leaveTypes.map((t) => ({
    value: t._id,
    label: t.name,
  }));

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-success">Approved</span>;
      case 'submitted':
        return <span className="badge badge-info">Submitted / In Review</span>;
      case 'refused':
        return <span className="badge badge-danger">Refused</span>;
      default:
        return <span className="badge badge-neutral">{status || 'Draft'}</span>;
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="module-page">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Leave &amp; Time Off</h2>
          <p className="page-subtitle">Track your leave balances and submit time off requests</p>
        </div>
        <Button variant="primary" onClick={handleOpenModal}>
          🏖️ Request Time Off
        </Button>
      </div>

      {submitSuccess && (
        <div
          className="login-info-banner"
          style={{
            marginBottom: 20,
            backgroundColor: '#ECFDF5',
            color: '#065F46',
            border: '1px solid #6EE7B7',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
          }}
          role="alert"
        >
          {submitSuccess}
        </div>
      )}

      {/* ── Allocations Grid ── */}
      <div className="leave-balances-grid" style={{ marginBottom: 24 }}>
        {allocations.length > 0 ? (
          allocations.map((alloc) => {
            const name = alloc.timeOffTypeId?.name || 'Leave';
            const unit = alloc.timeOffTypeId?.unit || 'days';
            return (
              <div key={alloc._id} className="card leave-balance-card" style={{ padding: 20 }}>
                <span className="leave-type-title" style={{ fontSize: 'var(--font-size-md)' }}>{name}</span>
                <span className="leave-amount-big" style={{ margin: '8px 0' }}>
                  {alloc.remainingAmount}{' '}
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                    {unit} available
                  </span>
                </span>
                <span className="leave-sub-stat">
                  Allocated: {alloc.allocatedAmount} {unit} • Used: {alloc.takenAmount} {unit}
                </span>
              </div>
            );
          })
        ) : (
          <div className="card" style={{ padding: 20, gridColumn: '1 / -1' }}>
            <p className="text-muted text-sm">No leave allocations currently assigned.</p>
          </div>
        )}
      </div>

      {/* ── Requests History Table ── */}
      <div className="page-header" style={{ marginTop: 24, marginBottom: 16 }}>
        <h3 className="page-title" style={{ fontSize: 'var(--font-size-lg)' }}>
          My Time Off Requests
        </h3>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          title="No Time Off Requests"
          description="You haven't submitted any leave requests yet."
          action={{ label: 'Request Time Off', onClick: handleOpenModal }}
        />
      ) : (
        <div className="table-container card">
          <table>
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>From</th>
                <th>To</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req._id}>
                  <td>
                    <span className="font-semibold">{req.timeOffTypeId?.name || 'Leave'}</span>
                  </td>
                  <td>{formatDate(req.dateFrom)}</td>
                  <td>{formatDate(req.dateTo)}</td>
                  <td>
                    <span className="font-medium">{req.duration} day(s)</span>
                  </td>
                  <td>
                    <span className="text-muted text-sm">{req.reason || '—'}</span>
                  </td>
                  <td>{renderStatusBadge(req.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Request Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Request Time Off"
      >
        <form onSubmit={handleSubmitRequest}>
          {formError && (
            <div
              className="login-info-banner error-banner"
              style={{
                marginBottom: 16,
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                border: '1px solid #FCA5A5',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {formError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="leave-type-select">
              Leave Type <span className="required-star">*</span>
            </label>
            <Select
              id="leave-type-select"
              value={formData.timeOffTypeId}
              onChange={(e) => setFormData({ ...formData, timeOffTypeId: e.target.value })}
              options={typeOptions}
              placeholder="Select Leave Type"
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="date-from">
                Start Date <span className="required-star">*</span>
              </label>
              <Input
                id="date-from"
                type="date"
                value={formData.dateFrom}
                onChange={(e) => setFormData({ ...formData, dateFrom: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="date-to">
                End Date <span className="required-star">*</span>
              </label>
              <Input
                id="date-to"
                type="date"
                value={formData.dateTo}
                onChange={(e) => setFormData({ ...formData, dateTo: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="leave-reason">Reason / Comments</label>
            <textarea
              id="leave-reason"
              className="input"
              style={{ height: 80, padding: 10 }}
              placeholder="Brief explanation for your manager..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
          </div>

          <div className="modal-form-actions">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeeLeavePage;
