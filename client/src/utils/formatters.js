/**
 * PeopleOS — Formatting Utilities
 */

export const formatCurrency = (amount, currency = 'INR') => {
  const num = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const formatPeriod = (start, end) => {
  if (!start && !end) return '—';
  return `${formatDate(start)} — ${formatDate(end)}`;
};

export const getStatusBadgeClass = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'paid':
    case 'validated':
    case 'active':
    case 'approved':
      return 'badge badge--success';
    case 'computed':
    case 'processing':
    case 'pending':
      return 'badge badge--warning';
    case 'draft':
      return 'badge badge--info';
    case 'cancelled':
    case 'rejected':
      return 'badge badge--danger';
    default:
      return 'badge badge--neutral';
  }
};
