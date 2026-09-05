/**
 * PeopleOS — DepartmentTable Component
 * Module: Departments
 * Owner: Member 2
 *
 * FOUNDATION COMPONENT
 * Full implementation (columns, API integration, sorting, pagination)
 * will be added when the backend endpoint is available.
 *
 * Props:
 *   data    - Array of records from the API response
 *   loading - Boolean — show loading state
 *   error   - String  — show error state
 *   onEdit  - fn(item) — callback to open edit form
 *   onDelete - fn(item) — callback to trigger delete confirmation
 */
import React from 'react';
import Loading from '../../common/Loading';
import ErrorMessage from '../../common/ErrorMessage';
import EmptyState from '../../common/EmptyState';

const DepartmentTable = ({ data = [], loading = false, error = null, onEdit, onDelete }) => {
  if (loading) return <Loading message="Loading departments..." />;
  if (error)   return <ErrorMessage message={error} />;
  if (!data.length) return <EmptyState title="No Departments Found" description="No records to display." />;

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item.id || index}>
              <td>{index + 1}</td>
              <td>{item.name || item.id}</td>
              <td>
                <div className="flex gap-sm">
                  {onEdit   && <button className="btn btn-ghost btn-sm" onClick={() => onEdit(item)}>Edit</button>}
                  {onDelete && <button className="btn btn-danger btn-sm" onClick={() => onDelete(item)}>Delete</button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DepartmentTable;
