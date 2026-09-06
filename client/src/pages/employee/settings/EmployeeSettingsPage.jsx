/**
 * PeopleOS — Employee Settings Page
 * Route: /employee/settings
 *
 * Allows employee to configure contact information and notification preferences.
 * Reuses existing Card, Input, Button, Loading components.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Loading from '../../../components/common/Loading';
import ErrorMessage from '../../../components/common/ErrorMessage';
import Modal from '../../../components/common/Modal';
import {
  getProfile,
  updateProfile,
} from '../../../services/employee/employeePortalService';
import { changePassword } from '../../../services/auth/authService';
import '../employee.css';

const EmployeeSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);

  // Form State
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [attendanceAlerts, setAttendanceAlerts] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', type: '' });

  // Change Password State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getProfile();
      const p = res.data || res;
      setProfile(p);
      setPhone(p.phone || '');
      setAddress(p.address || '');
    } catch (err) {
      setError(err.message || 'Unable to load profile settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveContact = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback({ text: '', type: '' });
    try {
      await updateProfile({ phone, address });
      setFeedback({ text: 'Settings updated successfully!', type: 'success' });
      setTimeout(() => setFeedback({ text: '', type: '' }), 4000);
    } catch (err) {
      setFeedback({ text: err.message || 'Failed to update settings.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setIsPasswordModalOpen(true);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setFeedback({
        text: 'Password changed successfully! Your new password is now active.',
        type: 'success',
      });
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setFeedback({ text: '', type: '' }), 5000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password. Please verify your current password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return <Loading message="Loading settings..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadData} />;
  }

  return (
    <div className="module-page">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Account Settings</h2>
          <p className="page-subtitle">Manage your personal preferences and contact details</p>
        </div>
      </div>

      {feedback.text && (
        <div
          className={`login-info-banner ${feedback.type === 'error' ? 'error-banner' : ''}`}
          style={{
            marginBottom: 20,
            backgroundColor: feedback.type === 'error' ? '#FEF2F2' : '#ECFDF5',
            color: feedback.type === 'error' ? '#DC2626' : '#065F46',
            border: `1px solid ${feedback.type === 'error' ? '#FCA5A5' : '#6EE7B7'}`,
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
          }}
          role="alert"
        >
          {feedback.text}
        </div>
      )}

      <div className="profile-sections">
        {/* Contact Preferences */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📞 Contact Information</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSaveContact}>
              <div className="form-group">
                <label htmlFor="settings-email">Email Address (Managed by IT)</label>
                <Input
                  id="settings-email"
                  type="text"
                  value={profile?.email || ''}
                  disabled={true}
                />
              </div>

              <div className="form-group">
                <label htmlFor="settings-phone">Phone Number</label>
                <Input
                  id="settings-phone"
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="settings-address">Residential Address</label>
                <Input
                  id="settings-address"
                  type="text"
                  placeholder="Street, City, State, ZIP"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div style={{ marginTop: 20 }}>
                <Button variant="primary" type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Notifications & Preferences */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🔔 Notification Preferences</h3>
          </div>
          <div className="card-body">
            <div className="info-row-item">
              <div>
                <div className="font-semibold" style={{ fontSize: 'var(--font-size-sm)' }}>Email Notifications</div>
                <div className="text-muted text-sm">Receive email confirmation for leave approvals &amp; payslips</div>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--color-primary)' }}
              />
            </div>

            <div className="info-row-item">
              <div>
                <div className="font-semibold" style={{ fontSize: 'var(--font-size-sm)' }}>Attendance Reminder</div>
                <div className="text-muted text-sm">Remind me to check out at the end of scheduled work hours</div>
              </div>
              <input
                type="checkbox"
                checked={attendanceAlerts}
                onChange={(e) => setAttendanceAlerts(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--color-primary)' }}
              />
            </div>

            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 8 }}>
                🔒 Security &amp; Password
              </h4>
              <p className="text-muted text-sm" style={{ marginBottom: 12 }}>
                Logged in as <strong>{profile?.employeeCode}</strong> ({profile?.email}). You can set or change your account password anytime.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenPasswordModal}
              >
                🔒 Change Password
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="🔒 Change Account Password"
        size="md"
      >
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {passwordError && <ErrorMessage message={passwordError} />}

          <p className="text-muted text-sm">
            Enter your current password and choose a new password for your account ({profile?.email}).
          </p>

          <Input
            label="Current Password"
            type="password"
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <Input
            label="New Password"
            type="password"
            placeholder="At least 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPasswordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={passwordSaving}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeeSettingsPage;
