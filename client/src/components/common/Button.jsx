/**
 * PeopleOS — Button Component
 * Generic, reusable. Not HR or Payroll specific.
 */
import React from 'react';

const Button = ({
  children,
  variant = 'primary',   // 'primary' | 'secondary' | 'danger' | 'ghost'
  size = 'md',           // 'sm' | 'md' | 'lg'
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  className = '',
  ...rest
}) => {
  const cls = [
    'btn',
    `btn-${variant}`,
    size !== 'md' ? `btn-${size}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={cls}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading && <span className="btn-spinner" aria-hidden="true">⟳</span>}
      {children}
    </button>
  );
};

export default Button;
