/**
 * PeopleOS — Time Off Management Page
 * Routes: /hr/time-off, /hr/time-off/requests, /hr/time-off/allocations, /hr/time-off/types
 *
 * Connected to REAL backend API endpoints:
 * - /api/time-off-types
 * - /api/time-off-allocations
 * - /api/time-off-requests
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Modal from '../../../components/common/Modal';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import EmptyState from '../../../components/common/EmptyState';
import ErrorMessage from '../../../components/common/ErrorMessage';
import Loading from '../../../components/common/Loading';

import {
  getTimeOffTypes,
  createTimeOffType,
  updateTimeOffType,
  deleteTimeOffType,
  getAllocations,
  createAllocation,
  updateAllocation,
  deleteAllocation,
  getRequests,
  createRequest,
  submitRequest,
  approveRequest,
  refuseRequest,
  deleteRequest,
} from '../../../services/hr/timeOffService';
import { getEmployees } from '../../../services/hr/employeeService';
import './page.css';

const TimeOffPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = user?.role || 'admin';
  const isHR = ['admin', 'hr_manager'].includes(userRole);

  // Tab state derived from location path or state
  const activeTab = useMemo(() => {
    if (location.pathname.includes('/types')) return 'types';
    if (location.pathname.includes('/allocations')) return 'allocations';
    return 'requests';
  }, [location.pathname]);

  // Shared Core State
  const [employees, setEmployees] = useState([]);
  const [types, setTypes] = useState([]);
  const [allocations, setAllocations] = useState([]);
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

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [paginationMeta, setPaginationMeta] = useState({ totalPages: 1, total: 0 });

  // Modals State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    employeeId: user?.employeeId || '',
    timeOffTypeId: '',
    allocationId: '',
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

  // Allocations Modal
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [allocationForm, setAllocationForm] = useState({
    employeeId: '',
    timeOffTypeId: '',
    allocatedAmount: 20,
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: '',
    status: 'approved',
  });

  // Types Modal
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeForm, setTypeForm] = useState({
    name: '',
    unit: 'days',
    requiresAllocation: true,
    approvalRequired: true,
    affectsPayroll: true,
  });

  // Delete Confirm Modal
  const [deletingItem, setDeletingItem] = useState(null); // { type: 'request'|'allocation'|'type', id: '' }
  const [isDeleting, setIsDeleting] = useState(false);

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
        setAllocationForm((prev) => ({ ...prev, employeeId: empList[0]._id || empList[0].id }));
      }
      if (Array.isArray(typesList) && typesList.length > 0 && !requestForm.timeOffTypeId) {
        setRequestForm((prev) => ({ ...prev, timeOffTypeId: typesList[0]._id || typesList[0].id }));
        setAllocationForm((prev) => ({ ...prev, timeOffTypeId: typesList[0]._id || typesList[0].id }));
      }
    } catch (err) {
      console.warn('Reference data fetch warning:', err);
    }
  }, []);

  // Fetch Main Tab Data
  const fetchTabData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchReferenceData();

      if (activeTab === 'requests') {
        const params = {
          employeeId: filterEmployeeId || undefined,
          timeOffTypeId: filterTypeId || undefined,
          status: filterStatus || undefined,
          page,
          limit,
        };
        const res = await getRequests(params);
        const items = res?.data || res?.items || [];
        const meta = res?.meta || res?.pagination || { totalPages: 1, total: items.length };

        setRequests(Array.isArray(items) ? items : []);
        setPaginationMeta(meta);

        // Also fetch allocations to display balance cards
        const allocRes = await getAllocations({
          employeeId: filterEmployeeId || user?.employeeId || undefined,
        });
        const allocItems = allocRes?.data || allocRes?.items || [];
        setAllocations(Array.isArray(allocItems) ? allocItems : []);
      } else if (activeTab === 'allocations') {
        const params = {
          employeeId: filterEmployeeId || undefined,
          timeOffTypeId: filterTypeId || undefined,
          status: filterStatus || undefined,
          page,
          limit,
        };
        const res = await getAllocations(params);
        const items = res?.data || res?.items || [];
        const meta = res?.meta || res?.pagination || { totalPages: 1, total: items.length };

        setAllocations(Array.isArray(items) ? items : []);
        setPaginationMeta(meta);
      } else if (activeTab === 'types') {
        const res = await getTimeOffTypes();
        const items = res?.data || res || [];
        setTypes(Array.isArray(items) ? items : []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch time-off records from backend');
    } finally {
      setLoading(false);
    }
  }, [activeTab, filterEmployeeId, filterTypeId, filterStatus, page, limit, fetchReferenceData, user]);

  useEffect(() => {
    fetchTabData();
  }, [fetchTabData]);

  // Switch Tabs
  const handleTabChange = (tabKey) => {
    if (tabKey === 'requests') navigate('/hr/time-off');
    else if (tabKey === 'allocations') navigate('/hr/time-off/allocations');
    else if (tabKey === 'types') navigate('/hr/time-off/types');
    setPage(1);
  };

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

  // Balances grouped by type
  const activeBalances = useMemo(() => {
    const summary = {};
    allocations.forEach((alloc) => {
      const typeObj = typeof alloc.timeOffTypeId === 'object' ? alloc.timeOffTypeId : null;
      const typeId = typeObj?._id || alloc.timeOffTypeId;
      const typeName = typeObj?.name || 'Leave Type';
      const unit = typeObj?.unit || 'days';

      if (!summary[typeId]) {
        summary[typeId] = {
          typeId,
          typeName,
          unit,
          allocatedAmount: 0,
          takenAmount: 0,
          remainingAmount: 0,
        };
      }
      summary[typeId].allocatedAmount += alloc.allocatedAmount || 0;
      summary[typeId].takenAmount += alloc.takenAmount || 0;
      summary[typeId].remainingAmount += alloc.remainingAmount || 0;
    });

    return Object.values(summary);
  }, [allocations]);

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
        allocationId: requestForm.allocationId || undefined,
        dateFrom: requestForm.dateFrom,
        dateTo: requestForm.dateTo,
        duration: Number(requestForm.duration) || 1,
        reason: requestForm.reason,
      };

      const newReq = await createRequest(payload);
      showFeedback('Time off request created successfully as draft!');
      setIsRequestModalOpen(false);
      await fetchTabData();
    } catch (err) {
      showFeedback(err.message || 'Failed to submit time off request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Draft Request to 'submitted'
  const handleSubmitDraft = async (reqId) => {
    setActionLoading(true);
    try {
      await submitRequest(reqId);
      showFeedback('Time off request submitted for HR approval!');
      await fetchTabData();
    } catch (err) {
      showFeedback(err.message || 'Failed to submit request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Request (HR/Admin)
  const handleApproveRequest = async (reqId) => {
    setActionLoading(true);
    try {
      await approveRequest(reqId);
      showFeedback('Time off request approved! Remaining balance updated on backend.');
      await fetchTabData();
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
      showFeedback('Time off request refused.');
      setRefusalRecord(null);
      await fetchTabData();
    } catch (err) {
      showFeedback(err.message || 'Refusal failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Allocation Modal Submit (HR/Admin)
  const handleAllocationSubmit = async (e) => {
    e.preventDefault();
    if (!allocationForm.employeeId || !allocationForm.timeOffTypeId || !allocationForm.allocatedAmount) {
      showFeedback('Employee, Time Off Type, and Allocated Amount are required.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      await createAllocation({
        employeeId: allocationForm.employeeId,
        timeOffTypeId: allocationForm.timeOffTypeId,
        allocatedAmount: Number(allocationForm.allocatedAmount),
        validFrom: allocationForm.validFrom ? new Date(allocationForm.validFrom).toISOString() : undefined,
        validTo: allocationForm.validTo ? new Date(allocationForm.validTo).toISOString() : undefined,
        status: allocationForm.status,
      });
      showFeedback('Time off allocation created successfully!');
      setIsAllocationModalOpen(false);
      await fetchTabData();
    } catch (err) {
      showFeedback(err.message || 'Failed to create allocation', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Type Modal Submit (HR/Admin)
  const handleTypeSubmit = async (e) => {
    e.preventDefault();
    if (!typeForm.name.trim()) {
      showFeedback('Time Off Type name is required.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      if (editingType) {
        const typeId = editingType._id || editingType.id;
        await updateTimeOffType(typeId, typeForm);
        showFeedback('Time off type updated successfully!');
      } else {
        await createTimeOffType(typeForm);
        showFeedback('Time off type created successfully!');
      }
      setIsTypeModalOpen(false);
      setEditingType(null);
      await fetchTabData();
    } catch (err) {
      showFeedback(err.message || 'Failed to save time off type', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Type Modal
  const handleOpenEditType = (typeItem) => {
    setEditingType(typeItem);
    setTypeForm({
      name: typeItem.name || '',
      unit: typeItem.unit || 'days',
      requiresAllocation: typeItem.requiresAllocation ?? true,
      approvalRequired: typeItem.approvalRequired ?? true,
      affectsPayroll: typeItem.affectsPayroll ?? true,
    });
    setIsTypeModalOpen(true);
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      if (deletingItem.type === 'request') {
        await deleteRequest(deletingItem.id);
        showFeedback('Time off request deleted.');
      } else if (deletingItem.type === 'allocation') {
        await deleteAllocation(deletingItem.id);
        showFeedback('Time off allocation deleted.');
      } else if (deletingItem.type === 'type') {
        await deleteTimeOffType(deletingItem.id);
        showFeedback('Time off type deleted.');
      }
      setDeletingItem(null);
      await fetchTabData();
    } catch (err) {
      showFeedback(err.message || 'Delete operation failed', 'error');
    } finally {
      setIsDeleting(false);
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

  return (
    <div className="module-page time-off-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Time Off &amp; Leave Portal</h2>
          <p className="page-subtitle">Manage leave balances, request approvals, and time-off policy allocations</p>
        </div>
        <div className="flex gap-sm">
          <Button variant="secondary" onClick={fetchTabData} disabled={loading}>
            🔄 Refresh
          </Button>

          {activeTab === 'requests' && (
            <Button variant="primary" onClick={() => setIsRequestModalOpen(true)}>
              + Request Time Off
            </Button>
          )}

          {activeTab === 'allocations' && isHR && (
            <Button variant="primary" onClick={() => setIsAllocationModalOpen(true)}>
              + New Allocation
            </Button>
          )}

          {activeTab === 'types' && isHR && (
            <Button
              variant="primary"
              onClick={() => {
                setEditingType(null);
                setTypeForm({
                  name: '',
                  unit: 'days',
                  requiresAllocation: true,
                  approvalRequired: true,
                  affectsPayroll: true,
                });
                setIsTypeModalOpen(true);
              }}
            >
              + Create Time Off Type
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="time-off-tabs">
        <button
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => handleTabChange('requests')}
        >
          <span>🏖️</span> Leave Requests &amp; Balances
        </button>
        <button
          className={`tab-btn ${activeTab === 'allocations' ? 'active' : ''}`}
          onClick={() => handleTabChange('allocations')}
        >
          <span>📊</span> Allocations Management
        </button>
        <button
          className={`tab-btn ${activeTab === 'types' ? 'active' : ''}`}
          onClick={() => handleTabChange('types')}
        >
          <span>⚙️</span> Time Off Types
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`feedback-toast ${feedback.type === 'error' ? 'error' : ''}`}>
          <span>{feedback.type === 'error' ? '⚠️ ' : '✅ '} {feedback.text}</span>
          <button className="btn-link" onClick={() => setFeedback(null)}>✕</button>
        </div>
      )}

      {/* ────────────────────────────────────────────────── */}
      {/* TAB 1: REQUESTS & LEAVE BALANCES DASHBOARD          */}
      {/* ────────────────────────────────────────────────── */}
      {activeTab === 'requests' && (
        <>
          {/* Leave Balances Grid */}
          <div className="time-off-balance-grid">
            {activeBalances.length === 0 ? (
              <div className="card" style={{ padding: '1.25rem', color: '#64748b' }}>
                <span>No active leave allocations found for selected context.</span>
              </div>
            ) : (
              activeBalances.map((b) => {
                const pct = b.allocatedAmount > 0 ? Math.min(100, Math.round((b.takenAmount / b.allocatedAmount) * 100)) : 0;
                return (
                  <div className="balance-card" key={b.typeId}>
                    <div className="balance-card-header">
                      <span className="balance-card-title">{b.typeName}</span>
                      <span className="balance-unit-tag">{b.unit}</span>
                    </div>

                    <div className="balance-card-metrics">
                      <div className="metric-box">
                        <span className="metric-label">Allocated</span>
                        <span className="metric-num">{b.allocatedAmount}</span>
                      </div>
                      <div className="metric-box">
                        <span className="metric-label">Taken</span>
                        <span className="metric-num taken">{b.takenAmount}</span>
                      </div>
                      <div className="metric-box">
                        <span className="metric-label">Remaining</span>
                        <span className="metric-num remaining">{b.remainingAmount}</span>
                      </div>
                    </div>

                    <div className="balance-progress-bar" title={`${pct}% used`}>
                      <div className="balance-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

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
                    { value: 'draft', label: 'Draft' },
                    { value: 'submitted', label: 'Submitted' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'refused', label: 'Refused' },
                  ]}
                  placeholder="All Statuses"
                />
              </div>
            </div>
          </div>

          {/* Requests Table */}
          {loading ? (
            <Loading message="Loading time off requests..." />
          ) : error ? (
            <ErrorMessage message={error} onRetry={fetchTabData} />
          ) : requests.length === 0 ? (
            <EmptyState
              title="No time off requests found"
              description="No requests match your current filters."
              action={{ label: 'Request Time Off', onClick: () => setIsRequestModalOpen(true) }}
            />
          ) : (
            <div className="table-container card">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Leave Type</th>
                    <th>Date From</th>
                    <th>Date To</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Reason</th>
                    <th>Approver</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => {
                    const empName = req.employeeId?.fullName || req.employeeId?.employeeCode || 'Employee';
                    const typeName = req.timeOffTypeId?.name || 'Leave';
                    const unit = req.timeOffTypeId?.unit || 'days';
                    const recId = req._id || req.id;
                    const approver = req.approverId?.email || req.approverId?.role || '—';

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
                        <td>
                          <span className={`badge badge-${req.status}`}>
                            {req.status}
                          </span>
                        </td>
                        <td style={{ maxWidth: '160px' }} className="truncate">
                          {req.reason || '—'}
                        </td>
                        <td>{approver}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="actions-cell">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingRequest(req)}
                            >
                              Details
                            </Button>

                            {req.status === 'draft' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleSubmitDraft(recId)}
                              >
                                Submit
                              </Button>
                            )}

                            {isHR && (req.status === 'submitted' || req.status === 'draft') && (
                              <>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleApproveRequest(recId)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleOpenRefusal(req)}
                                >
                                  Refuse
                                </Button>
                              </>
                            )}

                            {req.status !== 'approved' && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setDeletingItem({ type: 'request', id: recId })}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="pagination-bar">
                <span className="pagination-info">
                  Showing page {page} of {paginationMeta.totalPages || 1} ({paginationMeta.total || requests.length} requests)
                </span>
                <div className="pagination-controls">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    ◀ Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= (paginationMeta.totalPages || 1) || loading}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next ▶
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ────────────────────────────────────────────────── */}
      {/* TAB 2: ALLOCATIONS MANAGEMENT                      */}
      {/* ────────────────────────────────────────────────── */}
      {activeTab === 'allocations' && (
        <>
          <div className="filters-toolbar card">
            <div className="time-off-filters">
              <div className="filter-group">
                <label>EMPLOYEE</label>
                <Select
                  id="alloc-emp-filter"
                  value={filterEmployeeId}
                  onChange={(e) => setFilterEmployeeId(e.target.value)}
                  options={employeeOptions}
                  placeholder="All Employees"
                />
              </div>

              <div className="filter-group">
                <label>LEAVE TYPE</label>
                <Select
                  id="alloc-type-filter"
                  value={filterTypeId}
                  onChange={(e) => setFilterTypeId(e.target.value)}
                  options={typeOptions}
                  placeholder="All Types"
                />
              </div>

              <div className="filter-group">
                <label>STATUS</label>
                <Select
                  id="alloc-status-filter"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  options={[
                    { value: 'approved', label: 'Approved' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'expired', label: 'Expired' },
                  ]}
                  placeholder="All Statuses"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <Loading message="Loading leave allocations..." />
          ) : error ? (
            <ErrorMessage message={error} onRetry={fetchTabData} />
          ) : allocations.length === 0 ? (
            <EmptyState
              title="No time off allocations found"
              description="No employee leave allocations matched the search criteria."
              action={isHR ? { label: 'Create Allocation', onClick: () => setIsAllocationModalOpen(true) } : null}
            />
          ) : (
            <div className="table-container card">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Time Off Type</th>
                    <th>Allocated</th>
                    <th>Taken</th>
                    <th>Remaining</th>
                    <th>Valid From</th>
                    <th>Valid To</th>
                    <th>Status</th>
                    {isHR && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((alloc) => {
                    const empName = alloc.employeeId?.fullName || alloc.employeeId?.employeeCode || 'Employee';
                    const typeName = alloc.timeOffTypeId?.name || 'Leave Type';
                    const unit = alloc.timeOffTypeId?.unit || 'days';
                    const recId = alloc._id || alloc.id;

                    return (
                      <tr key={recId}>
                        <td>
                          <strong>{empName}</strong>
                        </td>
                        <td>
                          <span className="dept-code-tag">{typeName}</span>
                        </td>
                        <td>{alloc.allocatedAmount} {unit}</td>
                        <td>
                          <span style={{ color: '#ea580c', fontWeight: 600 }}>{alloc.takenAmount} {unit}</span>
                        </td>
                        <td>
                          <span style={{ color: '#16a34a', fontWeight: 700 }}>{alloc.remainingAmount} {unit}</span>
                        </td>
                        <td>{formatDate(alloc.validFrom)}</td>
                        <td>{formatDate(alloc.validTo)}</td>
                        <td>
                          <span className={`badge ${alloc.status === 'approved' ? 'badge-success' : 'badge-warning'}`}>
                            {alloc.status}
                          </span>
                        </td>
                        {isHR && (
                          <td style={{ textAlign: 'right' }}>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setDeletingItem({ type: 'allocation', id: recId })}
                            >
                              Delete
                            </Button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ────────────────────────────────────────────────── */}
      {/* TAB 3: TIME OFF TYPES MANAGEMENT                   */}
      {/* ────────────────────────────────────────────────── */}
      {activeTab === 'types' && (
        <>
          {loading ? (
            <Loading message="Loading time off types..." />
          ) : error ? (
            <ErrorMessage message={error} onRetry={fetchTabData} />
          ) : types.length === 0 ? (
            <EmptyState
              title="No time off types defined"
              description="No time off policies exist yet in the system."
              action={isHR ? { label: 'Create Time Off Type', onClick: () => setIsTypeModalOpen(true) } : null}
            />
          ) : (
            <div className="table-container card">
              <table>
                <thead>
                  <tr>
                    <th>Type Name</th>
                    <th>Unit</th>
                    <th>Requires Allocation</th>
                    <th>Approval Required</th>
                    <th>Affects Payroll</th>
                    {isHR && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {types.map((t) => {
                    const recId = t._id || t.id;
                    return (
                      <tr key={recId}>
                        <td>
                          <strong>{t.name}</strong>
                        </td>
                        <td>
                          <span className="balance-unit-tag">{t.unit || 'days'}</span>
                        </td>
                        <td>{t.requiresAllocation ? '✅ Yes' : '❌ No'}</td>
                        <td>{t.approvalRequired ? '✅ Yes' : '❌ No'}</td>
                        <td>{t.affectsPayroll ? '✅ Yes' : '❌ No'}</td>
                        {isHR && (
                          <td style={{ textAlign: 'right' }}>
                            <div className="actions-cell">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleOpenEditType(t)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setDeletingItem({ type: 'type', id: recId })}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
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
                  label="Date From"
                  required
                  value={requestForm.dateFrom}
                  onChange={(e) => setRequestForm({ ...requestForm, dateFrom: e.target.value })}
                />
                <Input
                  id="req-date-to"
                  type="date"
                  label="Date To"
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
                label="Duration (days or hours)"
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
                Create Draft Request
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
          title="Refuse Time Off Request"
          size="sm"
        >
          <form onSubmit={handleRefuseSubmit}>
            <p className="text-sm text-muted">
              Specify reason for refusing request submitted by{' '}
              <strong>{refusalRecord.employeeId?.fullName || 'Employee'}</strong>:
            </p>
            <Input
              id="ref-reason"
              label="Refusal Reason"
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
                Refuse Request
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
          title="Time Off Request Details"
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
                <strong>Date Range:</strong>
                <span>{formatDate(viewingRequest.dateFrom)} to {formatDate(viewingRequest.dateTo)}</span>
              </div>
              <div className="detail-row">
                <strong>Duration:</strong>
                <span>{viewingRequest.duration} {viewingRequest.timeOffTypeId?.unit || 'days'}</span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                <span className={`badge badge-${viewingRequest.status}`}>{viewingRequest.status}</span>
              </div>
              <div className="detail-row">
                <strong>Reason:</strong>
                <span>{viewingRequest.reason || 'No reason provided'}</span>
              </div>
              <div className="detail-row">
                <strong>Approver:</strong>
                <span>{viewingRequest.approverId?.email || viewingRequest.approverId?.role || 'Pending'}</span>
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

      {/* New Allocation Modal (HR/Admin) */}
      {isAllocationModalOpen && (
        <Modal
          isOpen={isAllocationModalOpen}
          onClose={() => setIsAllocationModalOpen(false)}
          title="Grant New Time Off Allocation"
          size="md"
        >
          <form onSubmit={handleAllocationSubmit}>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
              <Select
                id="alloc-emp-select"
                label="Target Employee"
                required
                value={allocationForm.employeeId}
                onChange={(e) => setAllocationForm({ ...allocationForm, employeeId: e.target.value })}
                options={employeeOptions}
                placeholder="Select Employee"
              />

              <Select
                id="alloc-type-select"
                label="Time Off Policy Type"
                required
                value={allocationForm.timeOffTypeId}
                onChange={(e) => setAllocationForm({ ...allocationForm, timeOffTypeId: e.target.value })}
                options={typeOptions}
                placeholder="Select Policy Type"
              />

              <Input
                id="alloc-amount"
                type="number"
                min="0"
                step="0.5"
                label="Allocated Amount"
                required
                value={allocationForm.allocatedAmount}
                onChange={(e) => setAllocationForm({ ...allocationForm, allocatedAmount: e.target.value })}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input
                  id="alloc-valid-from"
                  type="date"
                  label="Valid From"
                  value={allocationForm.validFrom}
                  onChange={(e) => setAllocationForm({ ...allocationForm, validFrom: e.target.value })}
                />
                <Input
                  id="alloc-valid-to"
                  type="date"
                  label="Valid To (Optional)"
                  value={allocationForm.validTo}
                  onChange={(e) => setAllocationForm({ ...allocationForm, validTo: e.target.value })}
                />
              </div>

              <Select
                id="alloc-status"
                label="Allocation Status"
                value={allocationForm.status}
                onChange={(e) => setAllocationForm({ ...allocationForm, status: e.target.value })}
                options={[
                  { value: 'approved', label: 'Approved' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'expired', label: 'Expired' },
                ]}
              />
            </div>

            <div className="modal-form-actions">
              <Button
                variant="secondary"
                onClick={() => setIsAllocationModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={actionLoading}>
                Grant Allocation
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create / Edit Type Modal (HR/Admin) */}
      {isTypeModalOpen && (
        <Modal
          isOpen={isTypeModalOpen}
          onClose={() => setIsTypeModalOpen(false)}
          title={editingType ? 'Edit Time Off Type' : 'Create Time Off Type'}
          size="md"
        >
          <form onSubmit={handleTypeSubmit}>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
              <Input
                id="type-name"
                label="Policy Name"
                required
                placeholder="e.g. Annual Vacation, Sick Leave, Paid Personal"
                value={typeForm.name}
                onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
              />

              <Select
                id="type-unit"
                label="Measurement Unit"
                value={typeForm.unit}
                onChange={(e) => setTypeForm({ ...typeForm, unit: e.target.value })}
                options={[
                  { value: 'days', label: 'Days' },
                  { value: 'hours', label: 'Hours' },
                ]}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={typeForm.requiresAllocation}
                    onChange={(e) => setTypeForm({ ...typeForm, requiresAllocation: e.target.checked })}
                  />
                  <span>Requires Prior Allocation Balance</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={typeForm.approvalRequired}
                    onChange={(e) => setTypeForm({ ...typeForm, approvalRequired: e.target.checked })}
                  />
                  <span>Requires HR Approval</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={typeForm.affectsPayroll}
                    onChange={(e) => setTypeForm({ ...typeForm, affectsPayroll: e.target.checked })}
                  />
                  <span>Affects Payroll Calculation</span>
                </label>
              </div>
            </div>

            <div className="modal-form-actions">
              <Button
                variant="secondary"
                onClick={() => setIsTypeModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={actionLoading}>
                {editingType ? 'Save Policy' : 'Create Policy'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Confirm Deletion"
        message={`Are you sure you want to delete this ${deletingItem?.type || 'record'}? This action cannot be undone.`}
        loading={isDeleting}
      />
    </div>
  );
};

export default TimeOffPage;
