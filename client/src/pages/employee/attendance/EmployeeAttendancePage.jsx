/**
 * PeopleOS — Employee Attendance & Time Tracking Page
 * Route: /employee/attendance
 *
 * Displays today's attendance status, summary metrics, and filterable history table.
 * Reuses existing Table, Input, Select, Button, EmptyState, Loading, ErrorMessage components.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Button from '../../../components/common/Button';
import Select from '../../../components/common/Select';
import EmptyState from '../../../components/common/EmptyState';
import ErrorMessage from '../../../components/common/ErrorMessage';
import Loading from '../../../components/common/Loading';
import {
  getAttendanceHistory,
  getTodayAttendance,
  checkIn,
  checkOut,
} from '../../../services/employee/employeePortalService';
import '../employee.css';

const EmployeeAttendancePage = () => {
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState({ text: '', type: '' });

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState(String(new Date().getMonth() + 1));
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));

  // Fetch Attendance Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [todayRes, historyRes] = await Promise.all([
        getTodayAttendance(),
        getAttendanceHistory({
          status: statusFilter,
          month: monthFilter,
          year: yearFilter,
        }),
      ]);

      setTodayData(todayRes?.data || todayRes);
      const histPayload = historyRes?.data || historyRes;
      setHistory(histPayload?.items || []);
      setSummary(histPayload?.summary || null);
    } catch (err) {
      console.error('Failed to load attendance:', err);
      setError(err.message || 'Unable to retrieve attendance records.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, monthFilter, yearFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check In Handler
  const handleCheckIn = async () => {
    setActionLoading(true);
    setFeedbackMessage({ text: '', type: '' });
    try {
      await checkIn();
      setFeedbackMessage({ text: 'Checked in successfully!', type: 'success' });
      await fetchData();
    } catch (err) {
      setFeedbackMessage({ text: err.message || 'Check-in failed.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Check Out Handler
  const handleCheckOut = async () => {
    setActionLoading(true);
    setFeedbackMessage({ text: '', type: '' });
    try {
      await checkOut();
      setFeedbackMessage({ text: 'Checked out successfully! Shift completed.', type: 'success' });
      await fetchData();
    } catch (err) {
      setFeedbackMessage({ text: err.message || 'Check-out failed.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const todayRecord = todayData?.attendance;
  const isCheckedIn = !!todayRecord?.checkIn;
  const isCheckedOut = !!todayRecord?.checkOut;

  const formatTime = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Status Badge Mapper
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'present':
        return <span className="badge badge-success">Present</span>;
      case 'overtime':
        return <span className="badge badge-info">Overtime</span>;
      case 'late':
        return <span className="badge badge-warning">Late</span>;
      case 'absent':
        return <span className="badge badge-danger">Absent</span>;
      default:
        return <span className="badge badge-neutral">{status || 'Logged'}</span>;
    }
  };

  return (
    <div className="module-page">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Attendance Tracking</h2>
          <p className="page-subtitle">View your daily check-in logs, worked hours, and time sheets</p>
        </div>
      </div>

      {/* ── Action Alert ── */}
      {feedbackMessage.text && (
        <div
          className={`login-info-banner ${feedbackMessage.type === 'error' ? 'error-banner' : ''}`}
          style={{
            marginBottom: 20,
            backgroundColor: feedbackMessage.type === 'error' ? '#FEF2F2' : '#ECFDF5',
            color: feedbackMessage.type === 'error' ? '#DC2626' : '#065F46',
            border: `1px solid ${feedbackMessage.type === 'error' ? '#FCA5A5' : '#6EE7B7'}`,
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
          }}
          role="alert"
        >
          {feedbackMessage.text}
        </div>
      )}

      {/* ── Today's Attendance Strip Card ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 className="card-title">Today's Attendance Status</h3>
          <div className="flex items-center gap-sm">
            {!isCheckedIn ? (
              <Button variant="primary" size="sm" onClick={handleCheckIn} disabled={actionLoading}>
                {actionLoading ? 'Checking in...' : 'Check In'}
              </Button>
            ) : !isCheckedOut ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleCheckOut}
                disabled={actionLoading}
                style={{ background: '#DC2626' }}
              >
                {actionLoading ? 'Checking out...' : 'Check Out'}
              </Button>
            ) : (
              <span className="badge badge-success">✓ Shift Completed</span>
            )}
          </div>
        </div>
        <div className="card-body">
          <div className="attendance-metrics-grid" style={{ marginBottom: 0 }}>
            <div className="attendance-metric-item">
              <div className="metric-item-label">Check In</div>
              <div className="metric-item-value">{formatTime(todayRecord?.checkIn)}</div>
            </div>
            <div className="attendance-metric-item">
              <div className="metric-item-label">Check Out</div>
              <div className="metric-item-value">{formatTime(todayRecord?.checkOut)}</div>
            </div>
            <div className="attendance-metric-item">
              <div className="metric-item-label">Worked Hours</div>
              <div className="metric-item-value">{todayRecord?.workedHours ? `${todayRecord.workedHours} hrs` : '—'}</div>
            </div>
            <div className="attendance-metric-item">
              <div className="metric-item-label">Overtime</div>
              <div className="metric-item-value">
                {todayRecord?.workedHours && todayRecord.workedHours > 8
                  ? `${(todayRecord.workedHours - 8).toFixed(2)} hrs`
                  : '0.00 hrs'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="stats-cards-grid">
        <div className="stat-card">
          <div className="stat-card-icon">📅</div>
          <div>
            <div className="stat-card-label">Total Days Logged</div>
            <div className="stat-card-value">{summary?.totalDaysLogged || 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">✅</div>
          <div>
            <div className="stat-card-label">Days Present</div>
            <div className="stat-card-value">{summary?.daysPresent || 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">⏱️</div>
          <div>
            <div className="stat-card-label">Total Hours</div>
            <div className="stat-card-value">{summary?.totalHoursWorked || 0} hrs</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">⚡</div>
          <div>
            <div className="stat-card-label">Overtime Earned</div>
            <div className="stat-card-value">{summary?.overtimeEarned || 0} hrs</div>
          </div>
        </div>
      </div>

      {/* ── Filters Toolbar ── */}
      <div className="filters-toolbar card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Select
            id="month-filter"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            options={[
              { value: '1', label: 'January' },
              { value: '2', label: 'February' },
              { value: '3', label: 'March' },
              { value: '4', label: 'April' },
              { value: '5', label: 'May' },
              { value: '6', label: 'June' },
              { value: '7', label: 'July' },
              { value: '8', label: 'August' },
              { value: '9', label: 'September' },
              { value: '10', label: 'October' },
              { value: '11', label: 'November' },
              { value: '12', label: 'December' },
            ]}
          />
          <Select
            id="year-filter"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            options={[
              { value: '2026', label: '2026' },
              { value: '2025', label: '2025' },
            ]}
          />
          <Select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'present', label: 'Present' },
              { value: 'late', label: 'Late' },
              { value: 'overtime', label: 'Overtime' },
              { value: 'absent', label: 'Absent' },
            ]}
          />
        </div>
        {(statusFilter !== 'all' || monthFilter !== String(new Date().getMonth() + 1)) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter('all');
              setMonthFilter(String(new Date().getMonth() + 1));
              setYearFilter(String(new Date().getFullYear()));
            }}
          >
            Reset Filters
          </Button>
        )}
      </div>

      {/* ── Table / Content ── */}
      {loading ? (
        <Loading message="Loading attendance logs..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchData} />
      ) : history.length === 0 ? (
        <EmptyState
          title="No Attendance Records"
          description="No attendance sessions found matching the selected filter criteria."
        />
      ) : (
        <div className="table-container card">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Working Hours</th>
                <th>Overtime</th>
                <th>Status</th>
                <th>Remarks / Notes</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record) => {
                const hrs = record.workedHours || 0;
                const ot = hrs > 8 ? (hrs - 8).toFixed(2) : '0.00';
                return (
                  <tr key={record._id || record.id}>
                    <td>
                      <span className="font-semibold">{formatDate(record.checkIn)}</span>
                    </td>
                    <td>{formatTime(record.checkIn)}</td>
                    <td>{formatTime(record.checkOut)}</td>
                    <td>
                      <span className="font-medium">{hrs > 0 ? `${hrs} hrs` : '—'}</span>
                    </td>
                    <td>{ot !== '0.00' ? <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>+{ot} hrs</span> : '—'}</td>
                    <td>{renderStatusBadge(record.status)}</td>
                    <td>
                      <span className="text-muted text-sm">{record.notes || '—'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeeAttendancePage;
