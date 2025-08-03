import React from 'react';

const ProgressBar = ({ value, max = 100, color = 'primary', className = '', label = '', showValue = true }) => {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const colorClass = {
    primary: 'from-primary-500 to-primary-700',
    success: 'from-success-500 to-success-700',
    warning: 'from-warning-500 to-warning-700',
    error: 'from-error-500 to-error-700',
    gray: 'from-gray-300 to-gray-400',
  }[color] || 'from-primary-500 to-primary-700';

  return (
    <div className={`w-full bg-gray-200 rounded-full h-3 overflow-hidden ${className}`} aria-label={label}>
      <div
        className={`bg-gradient-to-r ${colorClass} h-3 rounded-full transition-all duration-700 ease-out`}
        style={{ width: `${percent}%` }}
        aria-valuenow={value}
        aria-valuemax={max}
        role="progressbar"
      />
      {showValue && (
        <span className="ml-2 text-xs font-medium text-gray-700 align-middle">{Math.round(percent)}%</span>
      )}
    </div>
  );
};

export default ProgressBar; 