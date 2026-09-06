/**
 * PeopleOS — Payroll Warnings Display
 */
import React from 'react';

const PayrollWarnings = ({ warnings = [] }) => {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="payroll-warnings-box">
      <div className="payroll-warnings-title">
        <span>⚠️</span>
        <span>Payroll Warnings ({warnings.length})</span>
      </div>
      <ul className="payroll-warnings-list">
        {warnings.map((w, idx) => (
          <li key={idx}>
            {typeof w === 'string' ? w : (
              <span>
                <strong>[{w.severity?.toUpperCase() || 'WARNING'}]</strong> {w.message}
                {w.employeeName ? ` (${w.employeeName})` : ''}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PayrollWarnings;
