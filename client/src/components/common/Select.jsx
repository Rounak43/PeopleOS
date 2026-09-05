/**
 * PeopleOS — Select Component
 * Generic dropdown with label and error display.
 */
import React from 'react';

const Select = ({
  id,
  label,
  value,
  onChange,
  options = [],      // [{ value, label }]
  placeholder = 'Select...',
  error = '',
  required = false,
  disabled = false,
  className = '',
  ...rest
}) => {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={id}>
          {label}
          {required && <span style={{ color: 'var(--color-danger)', marginLeft: 2 }}>*</span>}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={error ? 'error' : ''}
        {...rest}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
};

export default Select;
