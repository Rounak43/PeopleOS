/**
 * PeopleOS — TimeOffForm Component
 * Module: Time Off
 * Owner: Member 2
 *
 * FOUNDATION COMPONENT
 * Full form fields will be added when the backend API schema is confirmed.
 *
 * Props:
 *   initialData  - Existing record for edit mode (null for create)
 *   onSubmit     - fn(formData) — called on valid form submission
 *   onCancel     - fn() — called when user cancels
 *   loading      - Boolean — disable submit while saving
 *   error        - String  — API error to show after submit
 */
import React, { useState } from 'react';
import Input from '../../common/Input';
import Button from '../../common/Button';

const TimeOffForm = ({ initialData = null, onSubmit, onCancel, loading = false, error = null }) => {
  const [formData, setFormData] = useState(initialData || { name: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        id="name"
        label="Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
        placeholder="Enter name..."
      />

      {error && (
        <p style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)', marginBottom: 12 }}>
          {error}
        </p>
      )}

      <div className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
        <Button variant="secondary" type="button" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={loading}>
          {initialData ? 'Save Changes' : 'Create'}
        </Button>
      </div>
    </form>
  );
};

export default TimeOffForm;
