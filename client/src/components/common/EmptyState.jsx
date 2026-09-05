/**
 * PeopleOS — EmptyState Component
 * Displayed when an API returns an empty list.
 */
import React from 'react';

const EmptyState = ({
  title = 'No records found',
  description = 'There are no items to display at this time.',
  action = null,        // { label: string, onClick: fn }
}) => {
  return (
    <div className="empty-state-container">
      <div className="empty-state-icon">📂</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {action && (
        <button className="btn btn-primary btn-sm" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
