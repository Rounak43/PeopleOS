/**
 * PeopleOS — Salary Structures View Component
 */
import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import SalaryStructureForm from './SalaryStructureForm';
import { getSalaryStructures } from '../../services/payroll/salaryStructureService';

const SalaryStructures = () => {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);

  const fetchStructures = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSalaryStructures();
      const data = res?.data || res;
      setStructures(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch salary structures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStructures();
  }, []);

  const handleCreate = () => {
    setEditingStructure(null);
    setIsModalOpen(true);
  };

  const handleEdit = (struct) => {
    setEditingStructure(struct);
    setIsModalOpen(true);
  };

  return (
    <div className="payroll-card">
      <div className="payroll-card-header">
        <div>
          <h3 className="payroll-card-title">Salary Structures</h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
            Salary structures group salary rules into packages assigned to employee contracts.
          </p>
        </div>

        <Button variant="primary" onClick={handleCreate}>
          + Create Structure
        </Button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>
          Loading salary structures...
        </p>
      ) : structures.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>
          No salary structures found. Click <strong>Create Structure</strong> to add one.
        </p>
      ) : (
        <div className="payroll-table-wrapper">
          <table className="payroll-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Structure Name</th>
                <th>Description</th>
                <th>Assigned Rules</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {structures.map((s) => {
                const rulesCount = (s.rules || []).length;
                const rulesSummary = (s.rules || [])
                  .map((r) => (typeof r === 'object' ? r.code : r))
                  .slice(0, 4)
                  .join(', ');

                return (
                  <tr key={s._id || s.id}>
                    <td><strong>{s.code}</strong></td>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.description || '—'}</td>
                    <td>
                      {rulesCount > 0 ? (
                        <span>
                          <strong>{rulesCount} rules</strong> ({rulesSummary}
                          {rulesCount > 4 ? '...' : ''})
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>Default Monthly Engine Rules</span>
                      )}
                    </td>
                    <td>
                      <Button variant="secondary" size="sm" onClick={() => handleEdit(s)}>
                        View / Edit
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <SalaryStructureForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        structure={editingStructure}
        onSuccess={fetchStructures}
      />
    </div>
  );
};

export default SalaryStructures;
