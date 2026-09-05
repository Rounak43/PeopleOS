/**
 * PeopleOS — Employee Profile Page
 * Route: /employee/profile
 *
 * Displays employee profile details with strict read-only protection on sensitive
 * fields (role, department, designation, salary) and self-service edit dialog for
 * contact details (phone, address, bank details).
 * Reuses existing Modal, Input, Button, Loading, ErrorMessage components.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Modal from '../../../components/common/Modal';
import Loading from '../../../components/common/Loading';
import ErrorMessage from '../../../components/common/ErrorMessage';
import {
  getProfile,
  updateProfile,
} from '../../../services/employee/employeePortalService';
import '../employee.css';

const EmployeeProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    phone: '',
    address: '',
    bankAccountNo: '',
    bankName: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getProfile();
      const profileData = res.data || res;
      setProfile(profileData);
      setEditData({
        phone: profileData.phone || '',
        address: profileData.address || '',
        bankAccountNo: profileData.bankDetails?.accountNo || '',
        bankName: profileData.bankDetails?.bankName || '',
      });
    } catch (err) {
      console.error('Failed to load employee profile:', err);
      setError(err.message || 'Unable to load profile data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleOpenEdit = () => {
    setEditData({
      phone: profile?.phone || '',
      address: profile?.address || '',
      bankAccountNo: profile?.bankDetails?.accountNo || '',
      bankName: profile?.bankDetails?.bankName || '',
    });
    setSaveError('');
    setSaveSuccess('');
    setIsEditOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError('');
    try {
      await updateProfile({
        phone: editData.phone,
        address: editData.address,
        bankDetails: {
          accountNo: editData.bankAccountNo,
          bankName: editData.bankName,
        },
      });
      setSaveSuccess('Contact details updated successfully!');
      setIsEditOpen(false);
      await fetchProfileData();
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err) {
      setSaveError(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <Loading message="Loading profile..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchProfileData} />;
  }

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="module-page">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h2 className="page-title">My Profile</h2>
          <p className="page-subtitle">Personal and professional employment details</p>
        </div>
        <Button variant="primary" onClick={handleOpenEdit}>
          ✏️ Edit Contact Info
        </Button>
      </div>

      {saveSuccess && (
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
          {saveSuccess}
        </div>
      )}

      {/* ── Profile Header Card ── */}
      <div className="card" style={{ marginBottom: 24, padding: 24 }}>
        <div className="profile-header-block">
          <div className="profile-avatar-lg">👤</div>
          <div>
            <div className="flex items-center gap-sm">
              <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>{profile?.fullName}</h3>
              <span className="welcome-code-badge">{profile?.employeeCode}</span>
              <span className="badge badge-success">{profile?.employmentStatus || 'Active'}</span>
            </div>
            <p className="text-muted text-sm" style={{ marginTop: 4 }}>
              {profile?.jobTitle} • {profile?.department}
            </p>
          </div>
        </div>
      </div>

      {/* ── Two Column Details Grid ── */}
      <div className="profile-sections">
        {/* Employment & Company Details */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🏢 Employment Information (Official)</h3>
            <span className="badge badge-neutral">Read-Only</span>
          </div>
          <div className="card-body">
            <div className="info-row-item">
              <span className="info-label">Employee ID</span>
              <span className="info-value font-semibold">{profile?.employeeCode}</span>
            </div>
            <div className="info-row-item">
              <span className="info-label">Department</span>
              <span className="info-value">{profile?.department || '—'}</span>
            </div>
            <div className="info-row-item">
              <span className="info-label">Job Position</span>
              <span className="info-value">{profile?.jobTitle || '—'}</span>
            </div>
            <div className="info-row-item">
              <span className="info-label">Reporting Manager</span>
              <span className="info-value">{profile?.manager || 'None'}</span>
            </div>
            <div className="info-row-item">
              <span className="info-label">Date Joined</span>
              <span className="info-value">{formatDate(profile?.dateJoined)}</span>
            </div>
            <div className="info-row-item">
              <span className="info-label">Employment Status</span>
              <span className="info-value">
                <span className="badge badge-success">{profile?.employmentStatus}</span>
              </span>
            </div>
            <div className="info-row-item">
              <span className="info-label">Work Schedule</span>
              <span className="info-value">{profile?.workingSchedule}</span>
            </div>
            {profile?.salary && (
              <div className="info-row-item">
                <span className="info-label">Annual Wage (Contract)</span>
                <span className="info-value font-semibold" style={{ color: 'var(--color-primary)' }}>
                  ${profile?.salary?.toLocaleString()} / yr
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Contact & Banking Details */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📞 Personal & Contact Details</h3>
            <span className="badge badge-info">Self-Service</span>
          </div>
          <div className="card-body">
            <div className="info-row-item">
              <span className="info-label">Corporate Email</span>
              <span className="info-value">{profile?.email}</span>
            </div>
            <div className="info-row-item">
              <span className="info-label">Phone Number</span>
              <span className="info-value">{profile?.phone || 'Not provided'}</span>
            </div>
            <div className="info-row-item">
              <span className="info-label">Residential Address</span>
              <span className="info-value">{profile?.address || 'Not provided'}</span>
            </div>
            <div className="info-row-item">
              <span className="info-label">Bank Name</span>
              <span className="info-value">{profile?.bankDetails?.bankName || 'Not configured'}</span>
            </div>
            <div className="info-row-item">
              <span className="info-label">Bank Account Number</span>
              <span className="info-value font-semibold">{profile?.bankDetails?.accountNo || '•••• ••••'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Personal Information"
      >
        <form onSubmit={handleSave}>
          {saveError && (
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
              {saveError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="edit-phone">Phone Number</label>
            <Input
              id="edit-phone"
              type="text"
              placeholder="+1 (555) 000-0000"
              value={editData.phone}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-address">Residential Address</label>
            <Input
              id="edit-address"
              type="text"
              placeholder="123 Main St, Apt 4B, City, Country"
              value={editData.address}
              onChange={(e) => setEditData({ ...editData, address: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-bank-name">Bank Name</label>
            <Input
              id="edit-bank-name"
              type="text"
              placeholder="e.g. Chase Bank, Wells Fargo"
              value={editData.bankName}
              onChange={(e) => setEditData({ ...editData, bankName: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-bank-account">Bank Account Number</label>
            <Input
              id="edit-bank-account"
              type="text"
              placeholder="e.g. •••• •••• 1234"
              value={editData.bankAccountNo}
              onChange={(e) => setEditData({ ...editData, bankAccountNo: e.target.value })}
            />
          </div>

          <div className="modal-form-actions">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsEditOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeeProfilePage;
