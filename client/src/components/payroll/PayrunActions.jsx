/**
 * PeopleOS — Payrun Actions
 */
import React, { useState } from 'react';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';

const PayrunActions = ({
  payrun,
  onCompute,
  onValidate,
  onMarkPaid,
  loadingAction,
}) => {
  const [confirmModal, setConfirmModal] = useState(null); // 'validate' | 'markPaid' | null

  if (!payrun) return null;

  const state = (payrun.state || 'Draft').toLowerCase();

  const handleConfirmAction = async () => {
    const action = confirmModal;
    setConfirmModal(null);
    if (action === 'validate') {
      await onValidate(payrun._id);
    } else if (action === 'markPaid') {
      await onMarkPaid(payrun._id);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {state === 'draft' && (
        <Button
          variant="primary"
          onClick={() => onCompute(payrun._id)}
          loading={loadingAction === 'compute'}
          disabled={!!loadingAction}
        >
          ⚡ Compute Payroll
        </Button>
      )}

      {state === 'computed' && (
        <>
          <Button
            variant="secondary"
            onClick={() => onCompute(payrun._id)}
            loading={loadingAction === 'compute'}
            disabled={!!loadingAction}
          >
            🔄 Re-Compute
          </Button>
          <Button
            variant="primary"
            onClick={() => setConfirmModal('validate')}
            loading={loadingAction === 'validate'}
            disabled={!!loadingAction}
          >
            ✓ Validate Payrun
          </Button>
        </>
      )}

      {state === 'validated' && (
        <Button
          variant="primary"
          onClick={() => setConfirmModal('markPaid')}
          loading={loadingAction === 'markPaid'}
          disabled={!!loadingAction}
        >
          💳 Mark as Paid
        </Button>
      )}

      {state === 'paid' && (
        <span className="badge badge--success" style={{ fontSize: '13px', padding: '6px 12px' }}>
          ✓ Payrun Paid & Completed
        </span>
      )}

      {/* Confirmation Modals */}
      <ConfirmDialog
        isOpen={confirmModal === 'validate'}
        onClose={() => setConfirmModal(null)}
        onConfirm={handleConfirmAction}
        title="Validate Payrun?"
        message="This will finalize payroll validation for this period. Are you sure you want to proceed?"
        confirmLabel="Validate"
        variant="primary"
        loading={loadingAction === 'validate'}
      />

      <ConfirmDialog
        isOpen={confirmModal === 'markPaid'}
        onClose={() => setConfirmModal(null)}
        onConfirm={handleConfirmAction}
        title="Mark Payrun as Paid?"
        message="This action records the payroll as paid and finalizes all payslips for employees."
        confirmLabel="Mark Paid"
        variant="primary"
        loading={loadingAction === 'markPaid'}
      />
    </div>
  );
};

export default PayrunActions;
