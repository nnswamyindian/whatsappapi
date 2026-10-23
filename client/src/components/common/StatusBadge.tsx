import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = (status || '').toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  if (['APPROVED', 'CONNECTED', 'DELIVERED', 'READ', 'ACTIVE', 'SUCCESS', 'VERIFIED'].includes(norm)) {
    styles = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    dotColor = 'bg-emerald-500';
  } else if (['PENDING', 'SUBMITTED', 'QUEUED', 'PROCESSING', 'SCHEDULED'].includes(norm)) {
    styles = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (['REJECTED', 'FAILED', 'DISCONNECTED', 'SUSPENDED', 'LOCKED'].includes(norm)) {
    styles = 'bg-rose-50 text-rose-800 border-rose-200';
    dotColor = 'bg-rose-500';
  } else if (['PAUSED', 'DRAFT', 'EXCLUDED'].includes(norm)) {
    styles = 'bg-slate-100 text-slate-700 border-slate-300';
    dotColor = 'bg-slate-400';
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${styles} ${sizeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      {status}
    </span>
  );
};
