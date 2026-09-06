/**
 * PeopleOS — Salary Rule Form Modal
 */
import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { createSalaryRule, updateSalaryRule } from '../../services/payroll/salaryRuleService';

const SalaryRuleForm = ({ isOpen, onClose, rule, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Allowance');
  const [amountType, setAmountType] = useState('Percentage');
  const [amountValue, setAmountValue] = useState(0);
  const [percentageBase, setPercentageBase] = useState('WAGE');
  const [formula, setFormula] = useState('');
  const [condition, setCondition] = useState('');
  const [sequence, setSequence] = useState(10);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (rule) {
      setName(rule.name || '');
      setCode(rule.code || '');
      setCategory(rule.category || 'Allowance');
      setAmountType(rule.amountType || 'Fixed');
      setAmountValue(rule.amountValue || 0);
      setPercentageBase(rule.percentageBase || 'WAGE');
      setFormula(rule.formula || '');
      setCondition(rule.condition || '');
      setSequence(rule.sequence || 10);
      setActive(rule.active !== false);
    } else {
      setName('');
      setCode('');
      setCategory('Allowance');
      setAmountType('Percentage');
      setAmountValue(10);
      setPercentageBase('WAGE');
      setFormula('');
      setCondition('');
      setSequence(10);
      setActive(true);
    }
    setError(null);
  }, [rule, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !code) {
      setError('Rule Name and Code are required');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      name,
      code: code.toUpperCase(),
      category,
      amountType,
      amountValue: Number(amountValue) || 0,
      percentageBase,
      formula,
      condition,
      sequence: Number(sequence) || 10,
      active,
    };

    try {
      if (rule && (rule._id || rule.id)) {
        await updateSalaryRule(rule._id || rule.id, payload);
      } else {
        await createSalaryRule(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save salary rule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={rule ? `Edit Salary Rule — ${rule.code}` : 'Create Salary Rule'}
      size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {rule ? 'Update Rule' : 'Create Rule'}
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
            label="Rule Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. House Rent Allowance"
            required
          />
          <Input
            label="Rule Code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. HRA"
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Category
            </label>
            <select
              className="payroll-select-filter"
              style={{ width: '100%' }}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Basic">Basic</option>
              <option value="Allowance">Allowance</option>
              <option value="Deduction">Deduction</option>
              <option value="Gross">Gross</option>
              <option value="Net">Net</option>
              <option value="Earnings">Earnings</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Computation Type
            </label>
            <select
              className="payroll-select-filter"
              style={{ width: '100%' }}
              value={amountType}
              onChange={(e) => setAmountType(e.target.value)}
            >
              <option value="Fixed">Fixed Amount</option>
              <option value="Percentage">Percentage (%)</option>
              <option value="Formula">Formula Expression</option>
            </select>
          </div>
        </div>

        {amountType === 'Fixed' && (
          <Input
            type="number"
            label="Fixed Amount (₹)"
            value={amountValue}
            onChange={(e) => setAmountValue(e.target.value)}
          />
        )}

        {amountType === 'Percentage' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              type="number"
              label="Percentage (%)"
              value={amountValue}
              onChange={(e) => setAmountValue(e.target.value)}
            />
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Percentage Base
              </label>
              <select
                className="payroll-select-filter"
                style={{ width: '100%' }}
                value={percentageBase}
                onChange={(e) => setPercentageBase(e.target.value)}
              >
                <option value="WAGE">Contract Wage (WAGE)</option>
                <option value="BASIC">Basic Salary (BASIC)</option>
                <option value="GROSS">Gross Salary (GROSS)</option>
              </select>
            </div>
          </div>
        )}

        {amountType === 'Formula' && (
          <Input
            label="Formula Expression"
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            placeholder="e.g. BASIC + HRA + CONV + SA"
            helpText="Refer to computed codes, e.g. BASIC + HRA"
          />
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input
            label="Condition Expression (Optional)"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            placeholder="e.g. WAGE <= 21000"
          />
          <Input
            type="number"
            label="Sequence (Execution Order)"
            value={sequence}
            onChange={(e) => setSequence(e.target.value)}
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Active Rule (Enable in payroll engine)
        </label>
      </form>
    </Modal>
  );
};

export default SalaryRuleForm;
