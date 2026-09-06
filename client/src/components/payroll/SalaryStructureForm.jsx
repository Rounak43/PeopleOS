/**
 * PeopleOS — Salary Structure Form Modal
 */
import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { getSalaryRules } from '../../services/payroll/salaryRuleService';
import { createSalaryStructure, updateSalaryStructure } from '../../services/payroll/salaryStructureService';

const isBasicRule = (rule) => {
  if (!rule) return false;
  const code = (rule.code || '').toUpperCase();
  const category = (rule.category || '').toLowerCase();
  const ruleName = (rule.name || '').toLowerCase();
  return code === 'BASIC' || category === 'basic' || ruleName.includes('basic salary') || ruleName === 'basic';
};

const isAttendanceRule = (rule) => {
  if (!rule) return false;
  const code = (rule.code || '').toUpperCase();
  const ruleName = (rule.name || '').toLowerCase();
  return (
    code === 'OVERTIME' ||
    code === 'UNDERTIME' ||
    code === 'ATTENDANCE' ||
    code === 'OT' ||
    ruleName.includes('overtime') ||
    ruleName.includes('undertime') ||
    ruleName.includes('attendance')
  );
};

const SalaryStructureForm = ({ isOpen, onClose, structure, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [selectedRuleIds, setSelectedRuleIds] = useState([]);
  const [allRules, setAllRules] = useState([]);

  const fetchRules = async () => {
    try {
      const res = await getSalaryRules();
      const data = res?.data || res;
      const rulesList = Array.isArray(data) ? data : [];
      setAllRules(rulesList);

      if (!structure) {
        // Select ALL rules by default when creating new structure (includes BASIC & Attendance rules)
        const defaultSelectedIds = rulesList.map((r) => r._id || r.id);
        setSelectedRuleIds(defaultSelectedIds);
      } else {
        // When editing existing structure: ensure BASIC rule is always included
        const existingIds = (structure.rules || []).map((r) => (typeof r === 'object' ? r._id || r.id : r));
        const basicRuleIds = rulesList.filter(isBasicRule).map((r) => r._id || r.id);
        const combinedIds = Array.from(new Set([...existingIds, ...basicRuleIds]));
        setSelectedRuleIds(combinedIds);
      }
    } catch {
      // Ignore rule fetch errors in form
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRules();
      if (structure) {
        setName(structure.name || '');
        setCode(structure.code || '');
        setDescription(structure.description || '');
      } else {
        setName('');
        setCode('');
        setDescription('');
      }
      setError(null);
    }
  }, [structure, isOpen]);

  const handleToggleRule = (r) => {
    const rId = r._id || r.id;
    // BASIC option must ALWAYS be clicked and used in configuration — cannot be unchecked
    if (isBasicRule(r)) {
      return;
    }

    setSelectedRuleIds((prev) =>
      prev.includes(rId) ? prev.filter((i) => i !== rId) : [...prev, rId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !code) {
      setError('Structure Name and Code are required');
      return;
    }

    setLoading(true);
    setError(null);

    // Guarantee BASIC rule ID is explicitly in payload
    const basicRuleIds = allRules.filter(isBasicRule).map((r) => r._id || r.id);
    const finalRuleIds = Array.from(new Set([...selectedRuleIds, ...basicRuleIds]));

    const payload = {
      name,
      code: code.toUpperCase(),
      description,
      rules: finalRuleIds,
    };

    try {
      if (structure && (structure._id || structure.id)) {
        await updateSalaryStructure(structure._id || structure.id, payload);
      } else {
        await createSalaryStructure(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save salary structure');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={structure ? `Edit Salary Structure — ${structure.code}` : 'Create Salary Structure'}
      size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {structure ? 'Update Structure' : 'Create Structure'}
          </Button>
        </div>
      }
    >
      {error && (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input
            label="Structure Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Standard Software Engineer Package"
            required
          />
          <Input
            label="Structure Code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. IT_DEV_STD"
            required
          />
        </div>

        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief summary of salary structure composition"
        />

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
            Assigned Salary Rules ({selectedRuleIds.length} assigned)
          </label>
          <div className="payroll-table-wrapper" style={{ maxHeight: '220px', overflowY: 'auto' }}>
            <table className="payroll-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Code</th>
                  <th>Rule Name</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {allRules.map((r) => {
                  const rId = r._id || r.id;
                  const isBasic = isBasicRule(r);
                  const isAtt = isAttendanceRule(r);
                  const isChecked = isBasic || selectedRuleIds.includes(rId);

                  return (
                    <tr
                      key={rId}
                      onClick={() => !isBasic && handleToggleRule(r)}
                      style={{
                        cursor: isBasic ? 'not-allowed' : 'pointer',
                        backgroundColor: isBasic ? '#F0FDF4' : isAtt ? '#FFFBEB' : 'transparent',
                      }}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isBasic}
                          onChange={() => {}}
                        />
                      </td>
                      <td>
                        <strong>{r.code}</strong>
                        {isBasic && (
                          <span
                            className="badge badge-success"
                            style={{ marginLeft: 6, fontSize: 10, padding: '2px 6px' }}
                          >
                            ✓ Always Active (Mandatory Basic)
                          </span>
                        )}
                        {isAtt && (
                          <span
                            className="badge badge-warning"
                            style={{ marginLeft: 6, fontSize: 10, padding: '2px 6px' }}
                          >
                            ⏱️ Default Attendance Rule
                          </span>
                        )}
                      </td>
                      <td>{r.name}</td>
                      <td>{r.category}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default SalaryStructureForm;
