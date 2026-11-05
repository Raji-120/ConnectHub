import React from 'react';

export const StatusIndicator = ({ status = 'offline', size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5',
  };

  const statusColors = {
    online: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
    away: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
    busy: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
    offline: 'bg-gray-400 dark:bg-gray-500',
  };

  return (
    <span
      className={`inline-block rounded-full ring-2 ring-gray-900 dark:ring-gray-900 ${
        sizeClasses[size] || sizeClasses.md
      } ${statusColors[status] || statusColors.offline} ${className}`}
      title={`Status: ${status}`}
    />
  );
};

export default StatusIndicator;
