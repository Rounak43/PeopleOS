/**
 * PeopleOS — Salary Rules View Component
 */
import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import SalaryRuleForm from './SalaryRuleForm';
import { getSalaryRules } from '../../services/payroll/salaryRuleService';
import { getStatusBadgeClass } from '../../utils/formatters';

const SalaryRules = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const fetchRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSalaryRules();
      const data = res?.data || res;
      setRules(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch salary rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleCreate = () => {
    setEditingRule(null);
    setIsModalOpen(true);
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  return (
    <div className="payroll-card">
      <div className="payroll-card-header">
        <div>
          <h3 className="payroll-card-title">Salary Rules</h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
            Rules executed by the backend Salary Computation Engine for earnings & deductions.
          </p>
        </div>

        <Button variant="primary" onClick={handleCreate}>
          + Create Rule
        </Button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>
          Loading salary rules...
        </p>
      ) : rules.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>
          No salary rules configured. Click <strong>Create Rule</strong> to add one.
        </p>
      ) : (
        <div className="payroll-table-wrapper">
          <table className="payroll-table">
            <thead>
              <tr>
                <th>Seq</th>
                <th>Code</th>
                <th>Rule Name</th>
                <th>Category</th>
                <th>Type</th>
                <th>Value / Formula</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r._id || r.id}>
                  <td><strong>{r.sequence}</strong></td>
                  <td><strong>{r.code}</strong></td>
                  <td>{r.name}</td>
                  <td>{r.category}</td>
                  <td>{r.amountType}</td>
                  <td>
                    {r.amountType === 'Percentage'
                      ? `${r.amountValue}% of ${r.percentageBase || 'WAGE'}`
                      : r.amountType === 'Fixed'
                      ? `₹${r.amountValue}`
                      : r.formula || '—'}
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(r.active !== false ? 'active' : 'cancelled')}>
                      {r.active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <Button variant="secondary" size="sm" onClick={() => handleEdit(r)}>
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SalaryRuleForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        rule={editingRule}
        onSuccess={fetchRules}
      />
    </div>
  );
};

export default SalaryRules;
