/**
 * PeopleOS — PayslipDetails Component
 * Module: Payslips
 * Owner: Member 3
 *
 * FOUNDATION COMPONENT — implementation will be added in a future step.
 */
import React from 'react';
import Loading from '../../common/Loading';
import ErrorMessage from '../../common/ErrorMessage';
import EmptyState from '../../common/EmptyState';

const PayslipDetails = ({ data = null, loading = false, error = null }) => {
  if (loading) return <Loading message="Loading..." />;
  if (error)   return <ErrorMessage message={error} />;
  if (!data)   return <EmptyState title="No Data" description="Data will appear here once the backend API is connected." />;

  return (
    <div className="card">
      <div className="card-body">
        <pre style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default PayslipDetails;
