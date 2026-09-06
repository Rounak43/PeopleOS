/**
 * PeopleOS — Time Off Management Page
 * Route: /hr/time-off
 *
 * Single clean allocation/request table where HR can review employee time off requests,
 * approve or reject them with real-time status updates synced with Employee portal.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useAuth from '../../../hooks/useAuth';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Modal from '../../../components/common/Modal';
import EmptyState from '../../../components/common/EmptyState';
import ErrorMessage from '../../../components/common/ErrorMessage';
import Loading from '../../../components/common/Loading';

import {
  getTimeOffTypes,
  getRequests,
  createRequest,
  approveRequest,
  refuseRequest,
} from '../../../services/hr/timeOffService';
import { getEmployees } from '../../../services/hr/employeeService';
import './page.css';

const TimeOffPage = () => {
  const { user } = useAuth();
  const userRole = user?.role || 'admin';
  const isHR = ['admin', 'hr_manager', 'hr_payroll_manager'].includes(userRole);

  // Shared Core State
  const [employees, setEmployees] = useState([]);
  const [types, setTypes] = useState([]);
  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterTypeId, setFilterTypeId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    employeeId: user?.employeeId || '',
    timeOffTypeId: '',
    dateFrom: new Date().toISOString().slice(0, 10),
    dateTo: new Date().toISOString().slice(0, 10),
    duration: 1,
    reason: '',
  });

  // Refusal Modal
  const [refusalRecord, setRefusalRecord] = useState(null);
  const [refusalReason, setRefusalReason] = useState('');

  // Details Modal
  const [viewingRequest, setViewingRequest] = useState(null);

  // Toast feedback helper
  const showFeedback = (text, type = 'success') => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Fetch reference data (Employees & Time Off Types)
  const fetchReferenceData = useCallback(async () => {
    try {
      const [empRes, typesRes] = await Promise.all([
        getEmployees(),
        getTimeOffTypes(),
      ]);

      const empList = empRes?.data || empRes || [];
      const typesList = typesRes?.data || typesRes || [];

      setEmployees(Array.isArray(empList) ? empList : []);
      setTypes(Array.isArray(typesList) ? typesList : []);

      if (Array.isArray(empList) && empList.length > 0 && !requestForm.employeeId) {
        setRequestForm((prev) => ({ ...prev, employeeId: empList[0]._id || empList[0].id }));
      }
      if (Array.isArray(typesList) && typesList.length > 0 && !requestForm.timeOffTypeId) {
        setRequestForm((prev) => ({ ...prev, timeOffTypeId: typesList[0]._id || typesList[0].id }));
      }
    } catch (err) {
      console.warn('Reference data fetch warning:', err);
    }
  }, [requestForm.employeeId, requestForm.timeOffTypeId]);

  // Fetch Main Requests Data
  const fetchRequestsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchReferenceData();
      const res = await getRequests({ limit: 100 });
      const items = res?.data || res?.items || [];
      setRequests(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch time-off records from backend');
    } finally {
      setLoading(false);
    }
  }, [fetchReferenceData]);

  useEffect(() => {
    fetchRequestsData();
  }, [fetchRequestsData]);

  // Dropdown options
  const employeeOptions = useMemo(() => {
    return employees.map((e) => ({
      value: e._id || e.id,
      label: `${e.fullName || `${e.firstName || ''} ${e.lastName || ''}`} (${e.employeeCode || 'EMP'})`,
    }));
  }, [employees]);

  const typeOptions = useMemo(() => {
    return types.map((t) => ({
      value: t._id || t.id,
      label: `${t.name} (${t.unit || 'days'})`,
    }));
  }, [types]);

  // Filtered Requests Array
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const empName = req.employeeId?.fullName || req.employeeId?.employeeCode || '';
      const typeName = req.timeOffTypeId?.name || '';
      const reason = req.reason || '';
      const q = searchQuery.toLowerCase();

      const matchesSearch =
        !searchQuery ||
        empName.toLowerCase().includes(q) ||
        typeName.toLowerCase().includes(q) ||
        reason.toLowerCase().includes(q);

      const matchesEmp =
        !filterEmployeeId ||
        (req.employeeId?._id || req.employeeId?.id || req.employeeId) === filterEmployeeId;

      const matchesType =
        !filterTypeId ||
        (req.timeOffTypeId?._id || req.timeOffTypeId?.id || req.timeOffTypeId) === filterTypeId;

      let matchesStatus = true;
      if (filterStatus === 'approved') {
        matchesStatus = req.status === 'approved';
      } else if (filterStatus === 'refused' || filterStatus === 'rejected') {
        matchesStatus = req.status === 'refused' || req.status === 'rejected';
      } else if (filterStatus === 'pending') {
        matchesStatus = req.status !== 'approved' && req.status !== 'refused' && req.status !== 'rejected';
      }

      return matchesSearch && matchesEmp && matchesType && matchesStatus;
    });
  }, [requests, searchQuery, filterEmployeeId, filterTypeId, filterStatus]);

  // Request Form Submit
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestForm.employeeId || !requestForm.timeOffTypeId || !requestForm.dateFrom || !requestForm.dateTo) {
      showFeedback('Please fill out all required fields.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        employeeId: requestForm.employeeId,
        timeOffTypeId: requestForm.timeOffTypeId,
        dateFrom: requestForm.dateFrom,
        dateTo: requestForm.dateTo,
        duration: Number(requestForm.duration) || 1,
        reason: requestForm.reason,
      };

      await createRequest(payload);
      showFeedback('Time off request created successfully!');
      setIsRequestModalOpen(false);
      await fetchRequestsData();
    } catch (err) {
      showFeedback(err.message || 'Failed to submit time off request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Request (HR/Admin)
  const handleApproveRequest = async (reqId) => {
    setActionLoading(true);
    try {
      await approveRequest(reqId);
      showFeedback('Time off request approved!');
      await fetchRequestsData();
    } catch (err) {
      showFeedback(err.message || 'Approval failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Refusal Dialog
  const handleOpenRefusal = (req) => {
    setRefusalRecord(req);
    setRefusalReason('');
  };

  // Submit Refusal
  const handleRefuseSubmit = async (e) => {
    e.preventDefault();
    if (!refusalRecord) return;

    setActionLoading(true);
    try {
      const reqId = refusalRecord._id || refusalRecord.id;
      await refuseRequest(reqId, { reason: refusalReason });
      showFeedback('Time off request rejected.');
      setRefusalRecord(null);
      await fetchRequestsData();
    } catch (err) {
      showFeedback(err.message || 'Rejection failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dStr) => {
    if (!dStr) return '—';
    return new Date(dStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    if (status === 'approved') {
      return <span className="badge badge-success">Approved</span>;
    }
    if (status === 'refused' || status === 'rejected') {
      return <span className="badge badge-danger">Rejected</span>;
    }
    return <span className="badge badge-warning">Pending</span>;
  };

  return (
    <div className="module-page time-off-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Time Off &amp; Leave Allocations</h2>
          <p className="page-subtitle">
            Manage employee time off allocations and review leave requests with immediate status approval
          </p>
        </div>
        <div className="flex gap-sm">
          <Button variant="secondary" onClick={fetchRequestsData} disabled={loading}>
            🔄 Refresh
          </Button>

          {isHR && (
            <Button variant="primary" onClick={() => setIsRequestModalOpen(true)}>
              + Request Time Off
            </Button>
          )}
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`feedback-toast ${feedback.type === 'error' ? 'error' : ''}`}>
          <span>{feedback.type === 'error' ? '⚠️ ' : '✅ '} {feedback.text}</span>
          <button className="btn-link" onClick={() => setFeedback(null)}>✕</button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="filters-toolbar card">
        <div className="time-off-filters">
          <div className="search-box">
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>SEARCH REQUESTS</label>
            <Input
              id="req-search"
              placeholder="Search by employee name or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>EMPLOYEE</label>
            <Select
              id="req-emp-filter"
              value={filterEmployeeId}
              onChange={(e) => setFilterEmployeeId(e.target.value)}
              options={employeeOptions}
              placeholder="All Employees"
            />
          </div>

          <div className="filter-group">
            <label>LEAVE TYPE</label>
            <Select
              id="req-type-filter"
              value={filterTypeId}
              onChange={(e) => setFilterTypeId(e.target.value)}
              options={typeOptions}
              placeholder="All Types"
            />
          </div>

          <div className="filter-group">
            <label>STATUS</label>
            <Select
              id="req-status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'refused', label: 'Rejected' },
              ]}
              placeholder="All Statuses"
            />
          </div>
        </div>
      </div>

      {/* Single Main Allocation & Requests Table */}
      {loading ? (
        <Loading message="Loading time off allocations..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchRequestsData} />
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          title="No time off records found"
          description="No leave requests match your search or filter criteria."
          action={{ label: 'Request Time Off', onClick: () => setIsRequestModalOpen(true) }}
        />
      ) : (
        <div className="table-container card">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Reason</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => {
                const empName = req.employeeId?.fullName || req.employeeId?.employeeCode || 'Employee';
                const typeName = req.timeOffTypeId?.name || 'Leave';
                const unit = req.timeOffTypeId?.unit || 'days';
                const recId = req._id || req.id;

                return (
                  <tr key={recId}>
                    <td>
                      <div className="employee-cell">
                        <span className="emp-avatar-icon">👤</span>
                        <div>
                          <strong>{empName}</strong>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="dept-code-tag">{typeName}</span>
                    </td>
                    <td>{formatDate(req.dateFrom)}</td>
                    <td>{formatDate(req.dateTo)}</td>
                    <td>
                      <strong>{req.duration} {unit}</strong>
                    </td>
                    <td>{renderStatusBadge(req.status)}</td>
                    <td style={{ maxWidth: '200px' }} className="truncate">
                      {req.reason || '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell" style={{ justifyContent: 'flex-end', display: 'flex', gap: '8px' }}>
                        {req.status === 'approved' ? (
                          <span
                            className="badge badge-success"
                            style={{ padding: '6px 14px', fontSize: '0.84rem', fontWeight: 600 }}
                          >
                            ✅ Approved
                          </span>
                        ) : req.status === 'refused' || req.status === 'rejected' ? (
                          <span
                            className="badge badge-danger"
                            style={{ padding: '6px 14px', fontSize: '0.84rem', fontWeight: 600 }}
                          >
                            ❌ Rejected
                          </span>
                        ) : (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', color: '#ffffff' }}
                              onClick={() => handleApproveRequest(recId)}
                              disabled={actionLoading}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleOpenRefusal(req)}
                              disabled={actionLoading}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ────────────────────────────────────────────────── */}
      {/* MODALS                                             */}
      {/* ────────────────────────────────────────────────── */}

      {/* Request Time Off Modal */}
      {isRequestModalOpen && (
        <Modal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          title="Request Time Off / Leave"
          size="md"
        >
          <form onSubmit={handleRequestSubmit}>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
              <Select
                id="req-emp-select"
                label="Employee"
                required
                value={requestForm.employeeId}
                onChange={(e) => setRequestForm({ ...requestForm, employeeId: e.target.value })}
                options={employeeOptions}
                placeholder="Select Employee"
              />

              <Select
                id="req-type-select"
                label="Time Off Policy Type"
                required
                value={requestForm.timeOffTypeId}
                onChange={(e) => setRequestForm({ ...requestForm, timeOffTypeId: e.target.value })}
                options={typeOptions}
                placeholder="Select Leave Type"
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input
                  id="req-date-from"
                  type="date"
                  label="Start Date"
                  required
                  value={requestForm.dateFrom}
                  onChange={(e) => setRequestForm({ ...requestForm, dateFrom: e.target.value })}
                />
                <Input
                  id="req-date-to"
                  type="date"
                  label="End Date"
                  required
                  value={requestForm.dateTo}
                  onChange={(e) => setRequestForm({ ...requestForm, dateTo: e.target.value })}
                />
              </div>

              <Input
                id="req-duration"
                type="number"
                step="0.5"
                min="0.5"
                label="Duration (days)"
                required
                value={requestForm.duration}
                onChange={(e) => setRequestForm({ ...requestForm, duration: e.target.value })}
              />

              <Input
                id="req-reason"
                label="Reason for Request"
                placeholder="Specify reason for requested leave..."
                value={requestForm.reason}
                onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
              />
            </div>

            <div className="modal-form-actions">
              <Button
                variant="secondary"
                onClick={() => setIsRequestModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={actionLoading}>
                Submit Request
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Refusal Reason Modal */}
      {refusalRecord && (
        <Modal
          isOpen={Boolean(refusalRecord)}
          onClose={() => setRefusalRecord(null)}
          title="Reject Time Off Request"
          size="sm"
        >
          <form onSubmit={handleRefuseSubmit}>
            <p className="text-sm text-muted">
              Specify reason for rejecting request submitted by{' '}
              <strong>{refusalRecord.employeeId?.fullName || 'Employee'}</strong>:
            </p>
            <Input
              id="ref-reason"
              label="Rejection Reason"
              placeholder="e.g. Peak operational period or insufficient coverage..."
              value={refusalReason}
              onChange={(e) => setRefusalReason(e.target.value)}
            />
            <div className="modal-form-actions">
              <Button
                variant="secondary"
                onClick={() => setRefusalRecord(null)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button variant="danger" type="submit" loading={actionLoading}>
                Reject Request
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Request Details View Modal */}
      {viewingRequest && (
        <Modal
          isOpen={Boolean(viewingRequest)}
          onClose={() => setViewingRequest(null)}
          title="Time Off Details"
          size="md"
        >
          <div className="profile-sections">
            <div className="profile-section">
              <div className="detail-row">
                <strong>Employee:</strong>
                <span>{viewingRequest.employeeId?.fullName || viewingRequest.employeeId?.employeeCode || '—'}</span>
              </div>
              <div className="detail-row">
                <strong>Leave Type:</strong>
                <span>{viewingRequest.timeOffTypeId?.name || '—'}</span>
              </div>
              <div className="detail-row">
                <strong>Start Date:</strong>
                <span>{formatDate(viewingRequest.dateFrom)}</span>
              </div>
              <div className="detail-row">
                <strong>End Date:</strong>
                <span>{formatDate(viewingRequest.dateTo)}</span>
              </div>
              <div className="detail-row">
                <strong>Duration:</strong>
                <span>{viewingRequest.duration} {viewingRequest.timeOffTypeId?.unit || 'days'}</span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                {renderStatusBadge(viewingRequest.status)}
              </div>
              <div className="detail-row">
                <strong>Reason:</strong>
                <span>{viewingRequest.reason || 'No reason provided'}</span>
              </div>
            </div>
          </div>
          <div className="modal-form-actions">
            <Button variant="secondary" onClick={() => setViewingRequest(null)}>
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TimeOffPage;
