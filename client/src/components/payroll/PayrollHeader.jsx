/**
 * PeopleOS — Payroll Header
 */
import React from 'react';
import Button from '../common/Button';

const PayrollHeader = ({ onCreatePayrun, showCreate = true }) => {
  return (
    <div className="payroll-header">
      <div className="payroll-header-info">
        <h1>Payroll</h1>
        <p>Manage payruns, employee payslips and payroll configuration.</p>
      </div>

      {showCreate && (
        <div className="payroll-header-actions">
          <Button variant="primary" onClick={onCreatePayrun}>
            <span style={{ marginRight: '6px', fontSize: '16px' }}>+</span>
            Create Payrun
          </Button>
        </div>
      )}
    </div>
  );
};

export default PayrollHeader;
