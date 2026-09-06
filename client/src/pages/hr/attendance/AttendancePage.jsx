/**
 * PeopleOS — Attendance Management Page
 * Route: /hr/attendance
 *
 * Connected to REAL backend API: /api/attendance, /api/attendance/check-in, /api/attendance/:id/check-out, /api/attendance/:id/correction
 * Native fetch API integration via attendanceService.js
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  getAttendance,
  checkIn,
  checkOut,
  correctAttendance,
  createAttendance,
  deleteAttendance,
} from '../../../services/hr/attendanceService';
import { getEmployees } from '../../../services/hr/employeeService';
import './page.css';

const AttendancePage = () => {
  const { user } = useAuth();
  const userRole = user?.role || 'admin';
  const isHR = ['admin', 'hr_manager'].includes(userRole);

  // Core Attendance State
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', text: '' }

  // Action State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(user?.employeeId || '');
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & Search
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [paginationMeta, setPaginationMeta] = useState({ totalPages: 1, total: 0 });

  // Correction & Create Modals
  const [correctionRecord, setCorrectionRecord] = useState(null);
  const [correctionForm, setCorrectionForm] = useState({
    checkIn: '',
    checkOut: '',
    status: 'present',
    notes: '',
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    employeeId: '',
    checkIn: new Date().toISOString().slice(0, 16),
    checkOut: '',
    status: 'present',
    notes: '',
  });

  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Employees for dropdowns
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await getEmployees();
        const empList = res?.data || res || [];
        if (Array.isArray(empList)) {
          setEmployees(empList);
          if (!selectedEmployeeId && empList.length > 0) {
            setSelectedEmployeeId(empList[0]._id || empList[0].id);
          }
        }
      } catch (err) {
        console.warn('Could not fetch employee list for attendance selector:', err);
      }
    };
    fetchEmployees();
  }, []);

  // Fetch Attendance Records from Backend
  const fetchAttendanceData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        employeeId: filterEmployeeId || undefined,
        status: filterStatus || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit,
      };

      const res = await getAttendance(params);
      const items = res?.data || res?.items || [];
      const meta = res?.meta || res?.pagination || { totalPages: 1, total: items.length };

      setRecords(Array.isArray(items) ? items : []);
      setPaginationMeta(meta);
    } catch (err) {
      setError(err.message || 'Failed to fetch attendance records from backend');
    } finally {
      setLoading(false);
    }
  }, [filterEmployeeId, filterStatus, startDate, endDate, page, limit]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  // Toast auto-clear
  const showFeedback = (text, type = 'success') => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Find Active Open Check-In Session for Selected Employee
  const activeOpenRecord = useMemo(() => {
    const targetEmpId = selectedEmployeeId || user?.employeeId;
    if (!targetEmpId) return null;
    return records.find(
      (r) =>
        (r.employeeId?._id === targetEmpId || r.employeeId === targetEmpId) &&
        !r.checkOut
    );
  }, [records, selectedEmployeeId, user]);

  // Find Latest Check-In Record for Today for Summary Card
  const todayRecord = useMemo(() => {
    const targetEmpId = selectedEmployeeId || user?.employeeId;
    const todayStr = new Date().toISOString().slice(0, 10);
    return records.find((r) => {
      const empIdMatch = !targetEmpId || (r.employeeId?._id === targetEmpId || r.employeeId === targetEmpId);
      const dateMatch = r.checkIn && r.checkIn.slice(0, 10) === todayStr;
      return empIdMatch && dateMatch;
    });
  }, [records, selectedEmployeeId, user]);

  // Handle Check-In Action
  const handleCheckIn = async () => {
    const empId = selectedEmployeeId || user?.employeeId;
    if (!empId) {
      showFeedback('Please select an employee to check in.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      await checkIn({ employeeId: empId });
      showFeedback('Checked in successfully!');
      await fetchAttendanceData();
    } catch (err) {
      showFeedback(err.message || 'Check-in failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Check-Out Action
  const handleCheckOut = async () => {
    if (!activeOpenRecord) {
      showFeedback('No open check-in session found to check out.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const recId = activeOpenRecord._id || activeOpenRecord.id;
      const res = await checkOut(recId);
      const worked = res?.data?.workedHours || res?.workedHours;
      showFeedback(`Checked out successfully! Worked ${worked || 0} hours.`);
      await fetchAttendanceData();
    } catch (err) {
      showFeedback(err.message || 'Check-out failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Correction Modal Open
  const handleOpenCorrection = (record) => {
    setCorrectionRecord(record);
    setCorrectionForm({
      checkIn: record.checkIn ? new Date(record.checkIn).toISOString().slice(0, 16) : '',
      checkOut: record.checkOut ? new Date(record.checkOut).toISOString().slice(0, 16) : '',
      status: record.status || 'present',
      adjustmentHours: '1',
      notes: record.notes || '',
    });
  };

  // Handle Correction Submit
  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    if (!correctionRecord) return;

    setActionLoading(true);
    try {
      const recId = correctionRecord._id || correctionRecord.id;
      let calculatedHours = 8;
      const adj = parseFloat(correctionForm.adjustmentHours) || 0;
      let notesText = correctionForm.notes;

      if (correctionForm.status === 'absent') {
        calculatedHours = 0;
        notesText = notesText || 'Status: Absent (0 hrs)';
      } else if (correctionForm.status === 'late') {
        calculatedHours = Math.max(0, 8 - adj);
        notesText = notesText || `Late by ${adj} hrs (Total: ${calculatedHours} hrs)`;
      } else if (correctionForm.status === 'overtime') {
        calculatedHours = 8 + adj;
        notesText = notesText || `Overtime: +${adj} hrs (Total: ${calculatedHours} hrs)`;
      } else if (correctionForm.status === 'present') {
        calculatedHours = 8;
        notesText = notesText || 'Standard 8.0h Shift';
      } else if (correctionRecord.workedHours) {
        calculatedHours = correctionRecord.workedHours;
      }

      await correctAttendance(recId, {
        checkIn: correctionForm.checkIn ? new Date(correctionForm.checkIn).toISOString() : undefined,
        checkOut: correctionForm.checkOut ? new Date(correctionForm.checkOut).toISOString() : undefined,
        status: correctionForm.status,
        workedHours: calculatedHours,
        notes: notesText,
      });
      showFeedback(`Attendance corrected! Worked hours updated to ${calculatedHours} hrs.`);
      setCorrectionRecord(null);
      await fetchAttendanceData();
    } catch (err) {
      showFeedback(err.message || 'Failed to apply attendance correction', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Manual Attendance Create (HR/Admin)
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.employeeId || !createForm.checkIn) {
      showFeedback('Employee and Check-in time are required', 'error');
      return;
    }

    setActionLoading(true);
    try {
      await createAttendance({
        employeeId: createForm.employeeId,
        checkIn: new Date(createForm.checkIn).toISOString(),
        checkOut: createForm.checkOut ? new Date(createForm.checkOut).toISOString() : null,
        status: createForm.status,
        notes: createForm.notes,
      });
      showFeedback('New attendance record created successfully!');
      setIsCreateModalOpen(false);
      await fetchAttendanceData();
    } catch (err) {
      showFeedback(err.message || 'Failed to create attendance record', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteAttendance(deletingId);
      showFeedback('Attendance record deleted.');
      setDeletingId(null);
      await fetchAttendanceData();
    } catch (err) {
      showFeedback(err.message || 'Failed to delete record', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter client-side search text on local items
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase();
    return records.filter((r) => {
      const empName = (r.employeeId?.fullName || r.employeeId?.name || '').toLowerCase();
      const empCode = (r.employeeId?.employeeCode || '').toLowerCase();
      const notes = (r.notes || '').toLowerCase();
      return empName.includes(q) || empCode.includes(q) || notes.includes(q);
    });
  }, [records, searchQuery]);

  const employeeOptions = useMemo(() => {
    return employees.map((e) => ({
      value: e._id || e.id,
      label: `${e.fullName || `${e.firstName || ''} ${e.lastName || ''}`} (${e.employeeCode || 'EMP'})`,
    }));
  }, [employees]);

  const clearFilters = () => {
    setFilterEmployeeId('');
    setFilterStatus('');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setPage(1);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="module-page attendance-page">
      {/* Top Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Attendance Management</h2>
          <p className="page-subtitle">Track real-time check-ins, worked hours, and attendance logs</p>
        </div>
        <div className="flex gap-sm">
          <Button variant="secondary" onClick={fetchAttendanceData} disabled={loading}>
            🔄 Refresh
          </Button>
          {isHR && (
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              + Log Attendance
            </Button>
          )}
        </div>
      </div>

      {/* Feedback Alert Toast */}
      {feedback && (
        <div className={`feedback-toast ${feedback.type === 'error' ? 'error' : ''}`}>
          <span>{feedback.type === 'error' ? '⚠️ ' : '✅ '} {feedback.text}</span>
          <button className="btn-link" onClick={() => setFeedback(null)}>✕</button>
        </div>
      )}

      {/* Toolbar / Filters */}
      <div className="filters-toolbar card">
        <div className="attendance-filters">
          <div className="search-box">
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>SEARCH LOGS</label>
            <Input
              id="att-search"
              placeholder="Search by employee name or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>EMPLOYEE FILTER</label>
            <Select
              id="att-emp-filter"
              value={filterEmployeeId}
              onChange={(e) => {
                setFilterEmployeeId(e.target.value);
                setPage(1);
              }}
              options={employeeOptions}
              placeholder="All Employees"
            />
          </div>

          <div className="filter-group">
            <label>STATUS FILTER</label>
            <Select
              id="att-status-filter"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'present', label: 'Present' },
                { value: 'late', label: 'Late' },
                { value: 'absent', label: 'Absent' },
                { value: 'overtime', label: 'Overtime' },
                { value: 'missing_checkout', label: 'Missing Checkout' },
              ]}
              placeholder="All Statuses"
            />
          </div>

          <div className="filter-group">
            <label>START DATE</label>
            <Input
              id="att-start-date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="filter-group">
            <label>END DATE</label>
            <Input
              id="att-end-date"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {(filterEmployeeId || filterStatus || startDate || endDate || searchQuery) && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <Loading message="Loading attendance records from backend..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchAttendanceData} />
      ) : filteredRecords.length === 0 ? (
        <EmptyState
          title="No attendance records found"
          description="No attendance logs matched your filter criteria."
          action={isHR ? { label: 'Log Attendance Record', onClick: () => setIsCreateModalOpen(true) } : null}
        />
      ) : (
        <div className="table-container card">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Worked Hours</th>
                <th>Status</th>
                <th>Correction</th>
                <th>Notes</th>
                {isHR && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r) => {
                const empName =
                  r.employeeId?.fullName ||
                  (r.employeeId?.firstName
                    ? `${r.employeeId.firstName} ${r.employeeId.lastName || ''}`
                    : 'Employee');
                const empCode = r.employeeId?.employeeCode || '';
                const recId = r._id || r.id;

                return (
                  <tr key={recId}>
                    <td>
                      <strong>{formatDateOnly(r.checkIn)}</strong>
                    </td>
                    <td>
                      <div className="employee-cell">
                        <span className="emp-avatar-icon">👤</span>
                        <div>
                          <strong>{empName}</strong>
                          {empCode && <div className="emp-sub-text">{empCode}</div>}
                        </div>
                      </div>
                    </td>
                    <td>{formatDateTime(r.checkIn)}</td>
                    <td>
                      {r.checkOut ? (
                        formatDateTime(r.checkOut)
                      ) : (
                        <span className="badge badge-warning">Active (Open)</span>
                      )}
                    </td>
                    <td>
                      <strong>{r.workedHours ? `${r.workedHours} hrs` : '0 hrs'}</strong>
                    </td>
                    <td>
                      <span className={`badge badge-${r.status || 'present'}`}>
                        {r.status || 'present'}
                      </span>
                    </td>
                    <td>
                      {r.isManualCorrection ? (
                        <span
                          className="correction-tag"
                          title={`Corrected by ${
                            typeof r.correctedBy === 'object'
                              ? r.correctedBy?.email || r.correctedBy?.role || 'Admin'
                              : 'HR Manager'
                          }`}
                        >
                          🛠️ Manual
                        </span>
                      ) : (
                        <span className="text-muted text-sm">—</span>
                      )}
                    </td>
                    <td style={{ maxWidth: '180px', fontSize: '0.85rem' }} className="truncate">
                      {r.notes || '—'}
                    </td>
                    {isHR && (
                      <td style={{ textAlign: 'right' }}>
                        <div className="actions-cell">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenCorrection(r)}
                          >
                            Correct
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setDeletingId(recId)}
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

          {/* Server-Side Pagination */}
          <div className="pagination-bar">
            <span className="pagination-info">
              Showing page {page} of {paginationMeta.totalPages || 1} ({paginationMeta.total || filteredRecords.length} total records)
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

      {/* Manual Correction Modal */}
      {correctionRecord && (
        <Modal
          isOpen={Boolean(correctionRecord)}
          onClose={() => setCorrectionRecord(null)}
          title={`Manual Attendance Correction — ${
            correctionRecord.employeeId?.fullName || 'Employee'
          }`}
          size="md"
        >
          <form onSubmit={handleCorrectionSubmit}>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
              <Input
                id="corr-check-in"
                type="datetime-local"
                label="Corrected Check-In Time"
                value={correctionForm.checkIn}
                onChange={(e) =>
                  setCorrectionForm({ ...correctionForm, checkIn: e.target.value })
                }
                required
              />
              <Input
                id="corr-check-out"
                type="datetime-local"
                label="Corrected Check-Out Time"
                value={correctionForm.checkOut}
                onChange={(e) =>
                  setCorrectionForm({ ...correctionForm, checkOut: e.target.value })
                }
              />
              <Select
                id="corr-status"
                label="Attendance Status"
                value={correctionForm.status}
                onChange={(e) =>
                  setCorrectionForm({ ...correctionForm, status: e.target.value })
                }
                options={[
                  { value: 'present', label: 'Present (Standard 8.0 hrs)' },
                  { value: 'late', label: 'Late (Subtract from 8.0 hrs)' },
                  { value: 'overtime', label: 'Overtime (Add to 8.0 hrs)' },
                  { value: 'absent', label: 'Absent (0.0 hrs)' },
                  { value: 'missing_checkout', label: 'Missing Checkout' },
                ]}
              />
              {correctionForm.status === 'late' && (
                <Input
                  id="corr-late-hrs"
                  type="number"
                  step="0.5"
                  min="0"
                  max="8"
                  label="How many hours late?"
                  placeholder="e.g. 1.5 (will deduct from 8.0 hrs)"
                  value={correctionForm.adjustmentHours}
                  onChange={(e) =>
                    setCorrectionForm({ ...correctionForm, adjustmentHours: e.target.value })
                  }
                  required
                />
              )}
              {correctionForm.status === 'overtime' && (
                <Input
                  id="corr-ot-hrs"
                  type="number"
                  step="0.5"
                  min="0"
                  label="How many overtime hours?"
                  placeholder="e.g. 2.0 (will add to 8.0 hrs)"
                  value={correctionForm.adjustmentHours}
                  onChange={(e) =>
                    setCorrectionForm({ ...correctionForm, adjustmentHours: e.target.value })
                  }
                  required
                />
              )}
              <Input
                id="corr-notes"
                label="Correction Reason / Notes"
                placeholder="Explain the reason for manual correction..."
                value={correctionForm.notes}
                onChange={(e) =>
                  setCorrectionForm({ ...correctionForm, notes: e.target.value })
                }
              />
            </div>

            <div className="modal-form-actions">
              <Button
                variant="secondary"
                onClick={() => setCorrectionRecord(null)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={actionLoading}>
                Save Correction
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Manual Create Attendance Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Log Manual Attendance Record"
          size="md"
        >
          <form onSubmit={handleCreateSubmit}>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
              <Select
                id="create-emp"
                label="Employee"
                required
                value={createForm.employeeId}
                onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value })}
                options={employeeOptions}
                placeholder="Select Employee"
              />
              <Input
                id="create-check-in"
                type="datetime-local"
                label="Check-In Time"
                required
                value={createForm.checkIn}
                onChange={(e) => setCreateForm({ ...createForm, checkIn: e.target.value })}
              />
              <Input
                id="create-check-out"
                type="datetime-local"
                label="Check-Out Time (Optional)"
                value={createForm.checkOut}
                onChange={(e) => setCreateForm({ ...createForm, checkOut: e.target.value })}
              />
              <Select
                id="create-status"
                label="Status"
                value={createForm.status}
                onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                options={[
                  { value: 'present', label: 'Present' },
                  { value: 'late', label: 'Late' },
                  { value: 'absent', label: 'Absent' },
                  { value: 'overtime', label: 'Overtime' },
                  { value: 'missing_checkout', label: 'Missing Checkout' },
                ]}
              />
              <Input
                id="create-notes"
                label="Notes"
                placeholder="Add attendance notes..."
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              />
            </div>

            <div className="modal-form-actions">
              <Button
                variant="secondary"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={actionLoading}>
                Log Record
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Attendance Record"
        message="Are you sure you want to delete this attendance log? This action cannot be undone."
        loading={isDeleting}
      />
    </div>
  );
};

export default AttendancePage;
