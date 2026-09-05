/**
 * PeopleOS — ErrorMessage Component
 * Displayed when an API call fails.
 */
import React from 'react';

const ErrorMessage = ({ message = 'Something went wrong. Please try again.', onRetry }) => {
  return (
    <div className="error-message-container" role="alert">
      <div className="error-message-icon">⚠</div>
      <p className="error-message-text">{message}</p>
      {onRetry && (
        <button className="btn btn-secondary btn-sm" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
