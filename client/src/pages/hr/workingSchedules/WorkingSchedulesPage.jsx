/**
 * PeopleOS — Working Schedules Page
 * Complete HR Management Module for Working Schedules
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getWorkingSchedules,
  createWorkingSchedule,
  updateWorkingSchedule,
  deleteWorkingSchedule,
} from '../../../services/hr/workingScheduleService';

import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Modal from '../../../components/common/Modal';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import Loading from '../../../components/common/Loading';
import EmptyState from '../../../components/common/EmptyState';
import ErrorMessage from '../../../components/common/ErrorMessage';

import './WorkingSchedulesPage.css';

const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const DEFAULT_DAY_CONFIG = {
  enabled: true,
  startTime: '09:00',
  endTime: '17:00',
  breakMinutes: 60,
};

const WorkingSchedulesPage = () => {
  // Data states
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form & selection states
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleType, setScheduleType] = useState('full_time');
  const [daysState, setDaysState] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Load Schedules
  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getWorkingSchedules();
      const items = res?.data?.items || res?.data || [];
      setSchedules(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err.message || 'Failed to load working schedules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Helper to initialize days state matrix
  const initDaysState = (existingLines = []) => {
    const linesMap = {};
    existingLines.forEach((line) => {
      if (line.dayOfWeek) {
        linesMap[line.dayOfWeek.toLowerCase()] = {
          enabled: true,
          startTime: line.startTime || '09:00',
          endTime: line.endTime || '17:00',
          breakMinutes: line.breakMinutes !== undefined ? line.breakMinutes : 60,
        };
      }
    });

    const newState = {};
    DAYS_OF_WEEK.forEach((day) => {
      if (linesMap[day]) {
        newState[day] = linesMap[day];
      } else {
        // Mon-Fri enabled by default for new schedule
        const isWeekday = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day);
        newState[day] = {
          ...DEFAULT_DAY_CONFIG,
          enabled: existingLines.length === 0 ? isWeekday : false,
        };
      }
    });
    return newState;
  };

  // Preview hours calculation
  const calculatePreviewHours = () => {
    let totalMinutes = 0;
    DAYS_OF_WEEK.forEach((day) => {
      const config = daysState[day];
      if (config && config.enabled) {
        const [sH, sM] = (config.startTime || '00:00').split(':').map(Number);
        const [eH, eM] = (config.endTime || '00:00').split(':').map(Number);
        const startMins = sH * 60 + sM;
        const endMins = eH * 60 + eM;
        const breakMins = parseInt(config.breakMinutes, 10) || 0;
        if (endMins > startMins) {
          totalMinutes += Math.max(0, endMins - startMins - breakMins);
        }
      }
    });
    return Math.round((totalMinutes / 60) * 100) / 100;
  };

  // Modal Handlers
  const handleOpenCreate = () => {
    setScheduleName('');
    setScheduleType('full_time');
    setDaysState(initDaysState([]));
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (schedule) => {
    setSelectedSchedule(schedule);
    setScheduleName(schedule.name || '');
    setScheduleType(schedule.type || 'full_time');
    setDaysState(initDaysState(schedule.lines || []));
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenView = (schedule) => {
    setSelectedSchedule(schedule);
    setIsViewModalOpen(true);
  };

  const handleOpenDelete = (schedule) => {
    setSelectedSchedule(schedule);
    setFormError(null);
    setIsDeleteDialogOpen(true);
  };

  const handleDayToggle = (day) => {
    setDaysState((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
      },
    }));
  };

  const handleDayFieldChange = (day, field, value) => {
    setDaysState((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const prepareLinesPayload = () => {
    const lines = [];
    DAYS_OF_WEEK.forEach((day) => {
      const config = daysState[day];
      if (config && config.enabled) {
        lines.push({
          dayOfWeek: day,
          startTime: config.startTime,
          endTime: config.endTime,
          breakMinutes: parseInt(config.breakMinutes, 10) || 0,
        });
      }
    });
    return lines;
  };

  const validateForm = (lines) => {
    if (!scheduleName.trim()) {
      return 'Schedule name is required';
    }
    if (lines.length === 0) {
      return 'At least one working day must be enabled';
    }
    for (const line of lines) {
      const [sH, sM] = line.startTime.split(':').map(Number);
      const [eH, eM] = line.endTime.split(':').map(Number);
      const startMins = sH * 60 + sM;
      const endMins = eH * 60 + eM;

      if (isNaN(startMins) || isNaN(endMins)) {
        return `Invalid time format on ${line.dayOfWeek}`;
      }
      if (endMins <= startMins) {
        return `End time must be after start time on ${line.dayOfWeek}`;
      }
      if (line.breakMinutes < 0) {
        return `Break minutes cannot be negative on ${line.dayOfWeek}`;
      }
    }
    return null;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const lines = prepareLinesPayload();
    const valErr = validateForm(lines);
    if (valErr) {
      setFormError(valErr);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await createWorkingSchedule({
        name: scheduleName,
        type: scheduleType,
        lines,
      });
      setIsCreateModalOpen(false);
      fetchSchedules();
    } catch (err) {
      setFormError(err.message || 'Failed to create working schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const lines = prepareLinesPayload();
    const valErr = validateForm(lines);
    if (valErr) {
      setFormError(valErr);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await updateWorkingSchedule(selectedSchedule._id, {
        name: scheduleName,
        type: scheduleType,
        lines,
      });
      setIsEditModalOpen(false);
      fetchSchedules();
    } catch (err) {
      setFormError(err.message || 'Failed to update working schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSchedule) return;
    setSubmitting(true);
    try {
      await deleteWorkingSchedule(selectedSchedule._id);
      setIsDeleteDialogOpen(false);
      fetchSchedules();
    } catch (err) {
      setError(err.message || 'Unable to delete working schedule because it is assigned to employees or contracts.');
      setIsDeleteDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Sort schedules sequentially (Morning -> Evening -> Night -> Part-time)
  const sortedSchedules = useMemo(() => {
    const order = ['morning', 'evening', 'night', 'hourly', 'intern'];
    return [...schedules].sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      const idxA = order.findIndex((key) => nameA.includes(key));
      const idxB = order.findIndex((key) => nameB.includes(key));
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return nameA.localeCompare(nameB);
    });
  }, [schedules]);

  // Helper to parse title and timing subtitle from raw schedule name
  const parseScheduleTitle = (rawName) => {
    if (!rawName) return { title: 'Standard Schedule', timing: '' };
    const match = rawName.match(/^([^(]+)(?:\(([^)]+)\))?/);
    if (match) {
      return {
        title: match[1].trim(),
        timing: match[2] ? match[2].trim() : '',
      };
    }
    return { title: rawName, timing: '' };
  };

  const typeOptions = [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'shift', label: 'Shift' },
  ];

  return (
    <div className="working-schedules-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Working Schedules</h2>
          <p className="page-subtitle">Configure employee working hours, IT shifts, and part-time schedules</p>
        </div>
        <Button variant="primary" onClick={handleOpenCreate}>
          + Create Working Schedule
        </Button>
      </div>

      {/* Error Alert */}
      {error && <ErrorMessage message={error} onRetry={fetchSchedules} />}

      {/* Content */}
      {loading ? (
        <Loading message="Loading working schedules..." />
      ) : schedules.length === 0 ? (
        <EmptyState
          icon="⏰"
          title="No working schedules found"
          message="Get started by creating your first employee working schedule."
          actionLabel="+ Create Working Schedule"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="table-container-card card">
          {/* Table Header Controls Bar */}
          <div className="table-meta-bar">
            <div className="meta-sequence-pill">
              <span>⏰ IT Work Schedules:</span> <strong>{sortedSchedules.length} Active Shifts</strong>
            </div>

            <div className="meta-stats-text">
              Sequential Arrangement: Morning, Evening, Night &amp; Part-Time Shifts
            </div>
          </div>

          {/* Framed Data Table */}
          <div className="table-scroll-frame">
            <table className="schedules-data-table">
              <thead>
                <tr>
                  <th style={{ width: '38%' }}>Schedule Name &amp; Work Hours</th>
                  <th style={{ width: '15%' }}>Shift Type</th>
                  <th style={{ width: '18%' }}>Weekly Hours</th>
                  <th style={{ width: '14%' }}>Working Days</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedSchedules.map((sched) => {
                  const { title, timing } = parseScheduleTitle(sched.name);
                  return (
                    <tr key={sched._id}>
                      <td>
                        <div className="employee-cell">
                          <span className="emp-avatar-icon">⏱️</span>
                          <div className="emp-name-block">
                            <button
                              className="btn-link"
                              onClick={() => handleOpenView(sched)}
                            >
                              {title}
                            </button>
                            {timing && <div className="emp-sub-text">{timing}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`type-badge type-${sched.type}`}>
                          {(sched.type || '').replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className="weekly-hours-tag">
                          {sched.totalWeeklyHours} hrs/wk
                        </span>
                      </td>
                      <td>
                        <span className="working-days-tag">
                          {Array.isArray(sched.lines) ? `${sched.lines.length} Days / Week` : '0 Days'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="actions-cell">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenView(sched)}>
                            View
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(sched)}>
                            Edit
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleOpenDelete(sched)}>
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

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Working Schedule"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && <ErrorMessage message={formError} />}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Schedule Name"
              placeholder="e.g. Standard 40h Shift"
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              required
            />
            <Select
              label="Schedule Type"
              options={typeOptions}
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>
              Weekly Schedule Lines
            </label>
            <table className="days-table">
              <thead>
                <tr>
                  <th>Working</th>
                  <th>Day</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Break (mins)</th>
                </tr>
              </thead>
              <tbody>
                {DAYS_OF_WEEK.map((day) => {
                  const conf = daysState[day] || DEFAULT_DAY_CONFIG;
                  return (
                    <tr key={day} style={{ backgroundColor: conf.enabled ? '#fff' : '#f8fafc' }}>
                      <td>
                        <input
                          type="checkbox"
                          checked={conf.enabled}
                          onChange={() => handleDayToggle(day)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                      </td>
                      <td className="day-label">{day}</td>
                      <td>
                        <input
                          type="time"
                          value={conf.startTime}
                          onChange={(e) => handleDayFieldChange(day, 'startTime', e.target.value)}
                          disabled={!conf.enabled}
                          className="input-field"
                          style={{ width: '120px', padding: '4px 8px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          value={conf.endTime}
                          onChange={(e) => handleDayFieldChange(day, 'endTime', e.target.value)}
                          disabled={!conf.enabled}
                          className="input-field"
                          style={{ width: '120px', padding: '4px 8px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={conf.breakMinutes}
                          onChange={(e) => handleDayFieldChange(day, 'breakMinutes', e.target.value)}
                          disabled={!conf.enabled}
                          className="input-field"
                          style={{ width: '80px', padding: '4px 8px', textAlign: 'center' }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="hours-preview-box">
            <span>Calculated Weekly Hours (Preview):</span>
            <span>{calculatePreviewHours()} hours</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Create Schedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Working Schedule"
        size="lg"
      >
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && <ErrorMessage message={formError} />}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Schedule Name"
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              required
            />
            <Select
              label="Schedule Type"
              options={typeOptions}
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>
              Weekly Schedule Lines
            </label>
            <table className="days-table">
              <thead>
                <tr>
                  <th>Working</th>
                  <th>Day</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Break (mins)</th>
                </tr>
              </thead>
              <tbody>
                {DAYS_OF_WEEK.map((day) => {
                  const conf = daysState[day] || DEFAULT_DAY_CONFIG;
                  return (
                    <tr key={day} style={{ backgroundColor: conf.enabled ? '#fff' : '#f8fafc' }}>
                      <td>
                        <input
                          type="checkbox"
                          checked={conf.enabled}
                          onChange={() => handleDayToggle(day)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                      </td>
                      <td className="day-label">{day}</td>
                      <td>
                        <input
                          type="time"
                          value={conf.startTime}
                          onChange={(e) => handleDayFieldChange(day, 'startTime', e.target.value)}
                          disabled={!conf.enabled}
                          className="input-field"
                          style={{ width: '120px', padding: '4px 8px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          value={conf.endTime}
                          onChange={(e) => handleDayFieldChange(day, 'endTime', e.target.value)}
                          disabled={!conf.enabled}
                          className="input-field"
                          style={{ width: '120px', padding: '4px 8px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={conf.breakMinutes}
                          onChange={(e) => handleDayFieldChange(day, 'breakMinutes', e.target.value)}
                          disabled={!conf.enabled}
                          className="input-field"
                          style={{ width: '80px', padding: '4px 8px', textAlign: 'center' }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="hours-preview-box">
            <span>Calculated Weekly Hours (Preview):</span>
            <span>{calculatePreviewHours()} hours</span>
          </div>

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
        title="Working Schedule Details"
        size="md"
      >
        {selectedSchedule && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="details-list">
              <div className="details-item">
                <span className="details-label">Schedule Name</span>
                <span className="details-value">{selectedSchedule.name}</span>
              </div>
              <div className="details-item">
                <span className="details-label">Type</span>
                <span className="details-value" style={{ textTransform: 'capitalize' }}>
                  {(selectedSchedule.type || '').replace('_', ' ')}
                </span>
              </div>
              <div className="details-item">
                <span className="details-label">Total Weekly Hours</span>
                <span className="details-value" style={{ color: 'var(--color-primary)', fontWeight: '700' }}>
                  {selectedSchedule.totalWeeklyHours} hrs/week
                </span>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--color-text-muted)' }}>
                Weekly Breakdown
              </h4>
              <table className="days-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Working</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Break</th>
                  </tr>
                </thead>
                <tbody>
                  {DAYS_OF_WEEK.map((day) => {
                    const line = (selectedSchedule.lines || []).find(
                      (l) => (l.dayOfWeek || '').toLowerCase() === day
                    );
                    return (
                      <tr key={day} style={{ backgroundColor: line ? '#fff' : '#f8fafc' }}>
                        <td className="day-label">{day}</td>
                        <td>{line ? '✓ Yes' : '— No'}</td>
                        <td>{line ? line.startTime : '—'}</td>
                        <td>{line ? line.endTime : '—'}</td>
                        <td>{line ? `${line.breakMinutes} min` : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Working Schedule"
        message={`Are you sure you want to delete "${selectedSchedule?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Schedule"
        loading={submitting}
      />
    </div>
  );
};

export default WorkingSchedulesPage;
