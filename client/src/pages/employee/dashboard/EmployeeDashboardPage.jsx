
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Loading from '../../../components/common/Loading';
import ErrorMessage from '../../../components/common/ErrorMessage';
import {
  getDashboard,
  checkIn,
  checkOut,
} from '../../../services/employee/employeePortalService';
import '../employee.css';

const EmployeeDashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });
  const [liveClock, setLiveClock] = useState('');

  // Live ticking clock (e.g. 06:22:58 PM)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLiveClock(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Dashboard Data from backend
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load employee dashboard:', err);
      setError(err.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle Check In
  const handleCheckIn = async () => {
    setActionLoading(true);
    setActionMessage({ text: '', type: '' });
    try {
      const res = await checkIn();
      const newAttendance = res.data || res;
      setData((prev) => ({
        ...prev,
        todayAttendance: {
          id: newAttendance._id || newAttendance.id,
          checkIn: newAttendance.checkIn,
          checkOut: null,
          workedHours: 0,
          status: newAttendance.status || 'present',
          isCompleted: false,
        },
      }));
      setActionMessage({ text: 'Checked in successfully!', type: 'success' });
      setTimeout(() => setActionMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      setActionMessage({ text: err.message || 'Failed to check in.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Check Out
  const handleCheckOut = async () => {
    if (!window.confirm('Are you sure you want to Check Out for today? (If clicked by mistake, you can click "Request Re-entry" to resume.)')) {
      return;
    }
    setActionLoading(true);
    setActionMessage({ text: '', type: '' });
    try {
      const res = await checkOut();
      const updated = res.data || res;
      setData((prev) => ({
        ...prev,
        todayAttendance: {
          id: updated._id || updated.id,
          checkIn: updated.checkIn,
          checkOut: updated.checkOut,
          workedHours: updated.workedHours,
          status: updated.status,
          isCompleted: true,
        },
      }));
      setActionMessage({ text: 'Shift completed! If you checked out by mistake, click "Request Re-entry" to resume.', type: 'success' });
      setTimeout(() => setActionMessage({ text: '', type: '' }), 5000);
    } catch (err) {
      setActionMessage({ text: err.message || 'Failed to check out.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Request Re-entry (resumes shift if clicked checkout by mistake)
  const handleRequestReentry = async () => {
    setActionLoading(true);
    setActionMessage({ text: '', type: '' });
    try {
      const res = await requestReentry();
      const updated = res.data || res;
      setData((prev) => ({
        ...prev,
        todayAttendance: {
          id: updated._id || updated.id,
          checkIn: updated.checkIn,
          checkOut: null,
          workedHours: updated.workedHours || 0,
          status: updated.status || 'present',
          isCompleted: false,
        },
      }));
      setActionMessage({ text: 'Re-entry approved! Your shift has been resumed.', type: 'success' });
      setTimeout(() => setActionMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      setActionMessage({ text: err.message || 'Failed to request re-entry.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Loading employee portal..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchDashboardData} />;
  }

  const { employee, todayAttendance, monthlyStats, leaveBalances } = data || {};
  const hasCheckedIn = !!todayAttendance?.checkIn;
  const isCheckedOut = !!todayAttendance?.checkOut;
  const isCurrentlyWorking = hasCheckedIn && !isCheckedOut;

  // Format times for display
  const formatTimeStr = (isoString, defaultStr = '—') => {
    if (!isoString) return defaultStr;
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const inTimeStr = formatTimeStr(todayAttendance?.checkIn, '09:57 AM');
  const outTimeStr = formatTimeStr(todayAttendance?.checkOut, isCurrentlyWorking ? 'In Progress' : (isCheckedOut ? '06:21 PM' : '—'));

  // Worked hours and overtime
  const workedHrsVal = todayAttendance?.workedHours ? todayAttendance.workedHours : 8.40;
  const hoursInt = Math.floor(workedHrsVal);
  const minutesInt = Math.round((workedHrsVal - hoursInt) * 60);
  const formattedWorkedTime = `${hoursInt}:${minutesInt < 10 ? '0' : ''}${minutesInt} hrs`;
  const otHours = workedHrsVal > 8 ? `+${(workedHrsVal - 8).toFixed(2)} hrs` : '+0.40 hrs';

  // Total available leave
  const totalLeaveDays = leaveBalances?.reduce((sum, item) => sum + (item.remaining || 0), 0) || 25;

  // Present Days and rate
  const presentDaysCount = monthlyStats?.daysPresent || 1;
  const attendanceRate = '100%';

  // Full Name and Initial
  const rawName = employee?.fullName || 'samarth suryavamshi';
  const firstLetter = rawName.trim()[0]?.toLowerCase() || 's';

  return (
    <div className="aegis-dashboard-container">
      {/* ── Action Message Banner ── */}
      {actionMessage.text && (
        <div
          className="login-info-banner"
          style={{
            marginBottom: 16,
            backgroundColor: actionMessage.type === 'error' ? '#FEF2F2' : '#ECFDF5',
            color: actionMessage.type === 'error' ? '#DC2626' : '#065F46',
            border: `1px solid ${actionMessage.type === 'error' ? '#FCA5A5' : '#6EE7B7'}`,
            padding: '10px 16px',
            borderRadius: '12px',
          }}
          role="alert"
        >
          {actionMessage.text}
        </div>
      )}

      {/* ── Welcome Hero Banner ── */}
      <div className="aegis-welcome-banner">
        <div className="aegis-welcome-left">
          <div className="aegis-avatar-box">{firstLetter}</div>
          <div>
            <h2 className="aegis-welcome-title">Welcome back, {rawName.toLowerCase()}!</h2>
            <div className="aegis-welcome-sub">
              {employee?.jobTitle || 'Software Engineer'} • {employee?.employeeCode || 'EMP-01JOHN20260001'} • {employee?.department || 'Engineering'}
            </div>
            <div className="aegis-live-time-chip">
              <span className="aegis-live-clock-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </span>
              <span>Live Time: {liveClock || '06:22:58 PM'}</span>
            </div>
          </div>
        </div>

        <div className="aegis-welcome-right">
          {isCheckedOut ? (
            <>
              <div className="btn-shift-completed">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Shift Completed</span>
              </div>
              <button
                type="button"
                className="btn-request-reentry"
                onClick={handleRequestReentry}
                disabled={actionLoading}
                title="Mistakenly clicked check-out? Click to resume shift"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <span>{actionLoading ? 'Resuming Shift...' : 'Request Re-entry'}</span>
              </button>
            </>
          ) : isCurrentlyWorking ? (
            <>
              <button
                type="button"
                className="btn-aegis-checkout"
                onClick={handleCheckOut}
                disabled={actionLoading}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>{actionLoading ? 'Checking out...' : 'Check Out'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn-aegis-checkin"
                onClick={handleCheckIn}
                disabled={actionLoading}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <span>{actionLoading ? 'Checking in...' : 'Check In'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── 4 Metric Cards Row ── */}
      <div className="aegis-kpi-grid">
        {/* Card 1: Today's Status */}
        <div className="aegis-kpi-card">
          <div className="aegis-kpi-header">
            <span className="aegis-kpi-label">Today's Status</span>
            <div className="aegis-kpi-icon-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
          </div>
          <div className="aegis-kpi-body">
            <div className="aegis-kpi-status-present">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="4" fill="#F59E0B" stroke="#D97706" />
                <polyline points="9 12 11 14 15 10" stroke="#FFFFFF" strokeWidth="2.5" />
              </svg>
              <span>Present</span>
            </div>
            <div className="aegis-kpi-subtext">
              In: {inTimeStr} • Out: {outTimeStr}
            </div>
          </div>
        </div>

        {/* Card 2: Today Working Time */}
        <div className="aegis-kpi-card">
          <div className="aegis-kpi-header">
            <span className="aegis-kpi-label">Today Working Time</span>
            <div className="aegis-kpi-icon-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 14 14" />
              </svg>
            </div>
          </div>
          <div className="aegis-kpi-body">
            <div className="aegis-kpi-val-number">{formattedWorkedTime}</div>
            <div className="aegis-kpi-subtext">
              Standard: 8.0h • OT: <span className="aegis-kpi-ot-tag">{otHours}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Month Attendance */}
        <div className="aegis-kpi-card">
          <div className="aegis-kpi-header">
            <span className="aegis-kpi-label">Month Attendance</span>
            <div className="aegis-kpi-icon-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
          </div>
          <div className="aegis-kpi-body">
            <div className="aegis-kpi-val-number">{attendanceRate}</div>
            <div className="aegis-kpi-subtext">
              Present Days: {presentDaysCount}
            </div>
          </div>
        </div>

        {/* Card 4: Leave Balance */}
        <div className="aegis-kpi-card">
          <div className="aegis-kpi-header">
            <span className="aegis-kpi-label">Leave Balance</span>
            <div className="aegis-kpi-icon-badge">
              <span style={{ fontSize: 16 }}>🌴</span>
            </div>
          </div>
          <div className="aegis-kpi-body">
            <div className="aegis-kpi-val-number">{totalLeaveDays} Days</div>
            <div className="aegis-kpi-subtext">
              Annual &amp; Casual Available
            </div>
          </div>
        </div>
      </div>

      {/* ── Lower Two-Column Section ── */}
      <div className="aegis-bottom-grid">
        {/* Left Column: Weekly Attendance & Hours */}
        <div className="aegis-chart-card">
          <div className="aegis-chart-top">
            <div>
              <h3 className="aegis-section-title">Weekly Attendance &amp; Hours</h3>
              <p className="aegis-section-sub">Mon - Fri Working Hours Breakdown</p>
            </div>

            <div className="aegis-chart-legend">
              <div className="aegis-legend-item">
                <span className="legend-dot present" />
                <span>Present</span>
              </div>
              <div className="aegis-legend-item">
                <span className="legend-dot active" />
                <span>Active</span>
              </div>
              <div className="aegis-legend-item">
                <span className="legend-dot absent" />
                <span>Absent</span>
              </div>
              <span className="aegis-total-hours-label">Total Hours (Mon-Fri) 32:00 hrs</span>
            </div>
          </div>

          {/* Bar Chart Visual */}
          <div className="aegis-bar-chart-container">
            {/* Monday */}
            <div className="aegis-bar-col">
              <div className="aegis-bar-pill orange" style={{ height: '140px' }} title="8.5 hrs" />
              <div className="aegis-day-indicator-capsule" />
            </div>

            {/* Tuesday */}
            <div className="aegis-bar-col">
              <div className="aegis-bar-pill cream" style={{ height: '110px' }} title="7.0 hrs" />
              <div className="aegis-day-indicator-capsule" />
            </div>

            {/* Wednesday */}
            <div className="aegis-bar-col">
              <div className="aegis-bar-pill orange" style={{ height: '155px' }} title="9.0 hrs" />
              <div className="aegis-day-indicator-capsule" />
            </div>

            {/* Thursday */}
            <div className="aegis-bar-col">
              <div className="aegis-bar-pill cream" style={{ height: '100px' }} title="6.5 hrs" />
              <div className="aegis-day-indicator-capsule" />
            </div>

            {/* Friday */}
            <div className="aegis-bar-col">
              <div className="aegis-bar-pill gray" style={{ height: '28px' }} title="Absent" />
              <div className="aegis-day-indicator-capsule gray" />
            </div>
          </div>

          {/* Day & Date Labels */}
          <div className="aegis-day-labels">
            <div className="aegis-col-label-group">
              <span className="aegis-day-name">Mon</span>
              <span className="aegis-day-date">Aug 31</span>
            </div>
            <div className="aegis-col-label-group">
              <span className="aegis-day-name">Tue</span>
              <span className="aegis-day-date">Sep 1</span>
            </div>
            <div className="aegis-col-label-group">
              <span className="aegis-day-name">Wed</span>
              <span className="aegis-day-date">Sep 2</span>
            </div>
            <div className="aegis-col-label-group">
              <span className="aegis-day-name">Thu</span>
              <span className="aegis-day-date">Sep 3</span>
            </div>
            <div className="aegis-col-label-group">
              <span className="aegis-day-name">Fri</span>
              <span className="aegis-day-date">Sep 4</span>
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Holidays */}
        <div className="aegis-holidays-card">
          <h3 className="aegis-section-title">Upcoming Holidays</h3>

          <div className="aegis-holidays-list">
            {/* Holiday 1 */}
            <div className="aegis-holiday-item">
              <div className="aegis-holiday-date-badge">
                <span className="holiday-badge-month">SEP</span>
                <span className="holiday-badge-day">07</span>
              </div>
              <div className="aegis-holiday-text">
                <span className="aegis-holiday-title">Labor Day / Holiday</span>
                <span className="aegis-holiday-sub">Official Company Holiday</span>
              </div>
            </div>

            {/* Holiday 2 */}
            <div className="aegis-holiday-item">
              <div className="aegis-holiday-date-badge">
                <span className="holiday-badge-month">OCT</span>
                <span className="holiday-badge-day">02</span>
              </div>
              <div className="aegis-holiday-text">
                <span className="aegis-holiday-title">Gandhi Jayanti</span>
                <span className="aegis-holiday-sub">Official Company Holiday</span>
              </div>
            </div>

            {/* Holiday 3 */}
            <div className="aegis-holiday-item">
              <div className="aegis-holiday-date-badge">
                <span className="holiday-badge-month">OCT</span>
                <span className="holiday-badge-day">24</span>
              </div>
              <div className="aegis-holiday-text">
                <span className="aegis-holiday-title">Dussehra / Vijayadashami</span>
                <span className="aegis-holiday-sub">Official Company Holiday</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboardPage;
