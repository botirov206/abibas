'use client';

const configs: Record<string, { dot: string; text: string; bg: string; label: string }> = {
  RELEASED:           { dot: 'bg-brand-teal',  text: 'text-brand-teal',    bg: 'bg-brand-teal/10',   label: 'Released' },
  PASSED:             { dot: 'bg-blue-500',     text: 'text-blue-600',      bg: 'bg-blue-50',         label: 'Passed' },
  QUARANTINE:         { dot: 'bg-amber-500',    text: 'text-amber-600',     bg: 'bg-amber-50',        label: 'Quarantine' },
  FAILED:             { dot: 'bg-red-500',      text: 'text-red-600',       bg: 'bg-red-50',          label: 'Failed' },
  DRAFT:              { dot: 'bg-brand-muted',  text: 'text-brand-muted',   bg: 'bg-gray-100',        label: 'Draft' },
  SENT:               { dot: 'bg-blue-500',     text: 'text-blue-600',      bg: 'bg-blue-50',         label: 'Sent' },
  PARTIALLY_RECEIVED: { dot: 'bg-amber-500',    text: 'text-amber-600',     bg: 'bg-amber-50',        label: 'Partial' },
  RECEIVED:           { dot: 'bg-brand-teal',   text: 'text-brand-teal',    bg: 'bg-brand-teal/10',   label: 'Received' },
  CANCELLED:          { dot: 'bg-red-400',      text: 'text-red-500',       bg: 'bg-red-50',          label: 'Cancelled' },
  PENDING:            { dot: 'bg-purple-500',   text: 'text-purple-600',    bg: 'bg-purple-50',       label: 'Pending' },
  PROCESSING:         { dot: 'bg-blue-500',     text: 'text-blue-600',      bg: 'bg-blue-50',         label: 'Processing' },
  SHIPPED:            { dot: 'bg-brand-teal',   text: 'text-brand-teal',    bg: 'bg-brand-teal/10',   label: 'Shipped' },
  DELIVERED:          { dot: 'bg-brand-teal',   text: 'text-brand-teal',    bg: 'bg-brand-teal/10',   label: 'Delivered' },
  ADMIN:              { dot: 'bg-red-500',      text: 'text-red-600',       bg: 'bg-red-50',          label: 'Admin' },
  WAREHOUSE_OPERATOR: { dot: 'bg-blue-500',     text: 'text-blue-600',      bg: 'bg-blue-50',         label: 'Operator' },
  PROCUREMENT:        { dot: 'bg-purple-500',   text: 'text-purple-600',    bg: 'bg-purple-50',       label: 'Procurement' },
  QC_INSPECTOR:       { dot: 'bg-amber-500',    text: 'text-amber-600',     bg: 'bg-amber-50',        label: 'QC Inspector' },
  MANAGER:            { dot: 'bg-brand-teal',   text: 'text-brand-teal',    bg: 'bg-brand-teal/10',   label: 'Manager' },
  RECEIVE:            { dot: 'bg-brand-teal',   text: 'text-brand-teal',    bg: 'bg-brand-teal/10',   label: 'Receive' },
  SHIP:               { dot: 'bg-blue-500',     text: 'text-blue-600',      bg: 'bg-blue-50',         label: 'Ship' },
  TRANSFER:           { dot: 'bg-brand-teal',   text: 'text-brand-teal',    bg: 'bg-brand-teal/10',   label: 'Transfer' },
  ADJUSTMENT:         { dot: 'bg-amber-500',    text: 'text-amber-600',     bg: 'bg-amber-50',        label: 'Adjustment' },
  RETURN:             { dot: 'bg-purple-500',   text: 'text-purple-600',    bg: 'bg-purple-50',       label: 'Return' },
};

export default function StatusBadge({ status }: { status: string }) {
  const c = configs[status] ?? { dot: 'bg-brand-muted', text: 'text-brand-muted', bg: 'bg-gray-100', label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
