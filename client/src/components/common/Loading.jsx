/**
 * PeopleOS — Loading Component
 * Displayed while an API request is in progress.
 */
import React from 'react';
import './Loading.css';

const Loading = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-container" role="status" aria-label={message}>
      <div className="loading-spinner" />
      <span className="loading-message">{message}</span>
    </div>
  );
};

export default Loading;
