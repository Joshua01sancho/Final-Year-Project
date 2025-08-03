import React from 'react';
import { Loader2 } from 'lucide-react';

// Spinner Component
export const Spinner = ({ size = 'md', className = '', ...props }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  return (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${className}`} 
      {...props}
    />
  );
};

// Skeleton Loader Components
export const Skeleton = ({ className = '', ...props }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} {...props} />
);

export const SkeletonText = ({ lines = 1, className = '', ...props }) => (
  <div className={`space-y-2 ${className}`} {...props}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className="h-4" />
    ))}
  </div>
);

export const SkeletonTitle = ({ className = '', ...props }) => (
  <Skeleton className={`h-6 mb-2 ${className}`} {...props} />
);

export const SkeletonAvatar = ({ size = 'md', className = '', ...props }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  return (
    <Skeleton className={`rounded-full ${sizeClasses[size]} ${className}`} {...props} />
  );
};

export const SkeletonCard = ({ className = '', ...props }) => (
  <div className={`card ${className}`} {...props}>
    <div className="flex items-center space-x-3 mb-4">
      <SkeletonAvatar size="md" />
      <div className="flex-1">
        <SkeletonTitle />
        <SkeletonText lines={2} />
      </div>
    </div>
    <SkeletonText lines={3} />
  </div>
);

// Progress Bar Component
export const ProgressBar = ({ 
  value = 0, 
  max = 100, 
  color = 'primary',
  showValue = true,
  className = '',
  ...props 
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const colorClasses = {
    primary: 'bg-primary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    error: 'bg-error-600'
  };

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`} {...props}>
      <div
        className={`h-2 rounded-full transition-all duration-300 ease-out ${colorClasses[color]}`}
        style={{ width: `${percentage}%` }}
      />
      {showValue && (
        <div className="text-xs text-gray-600 mt-1 text-right">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};

// Loading Overlay Component
export const LoadingOverlay = ({ 
  isVisible, 
  message = 'Loading...', 
  className = '',
  ...props 
}) => {
  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${className}`}
      {...props}
    >
      <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center space-y-4">
        <Spinner size="lg" />
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
};

// Loading State Component
export const LoadingState = ({ 
  isLoading, 
  children, 
  fallback = null,
  className = '',
  ...props 
}) => {
  if (isLoading) {
    return fallback || (
      <div className={`flex items-center justify-center p-8 ${className}`} {...props}>
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return children;
};

// Loading Button Component
export const LoadingButton = ({ 
  loading, 
  children, 
  loadingText = 'Loading...',
  disabled,
  className = '',
  ...props 
}) => {
  return (
    <button
      disabled={disabled || loading}
      className={`btn inline-flex items-center justify-center font-semibold transition-all duration-200 ${
        loading ? 'opacity-75 cursor-not-allowed' : ''
      } ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size="sm" className="mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
};

// Pulse Loading Component
export const PulseLoader = ({ className = '', ...props }) => (
  <div className={`flex space-x-1 ${className}`} {...props}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
        style={{ animationDelay: `${i * 0.2}s` }}
      />
    ))}
  </div>
);

// Dots Loading Component
export const DotsLoader = ({ className = '', ...props }) => (
  <div className={`flex space-x-1 ${className}`} {...props}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: `${i * 0.1}s` }}
      />
    ))}
  </div>
);

export default {
  Spinner,
  Skeleton,
  SkeletonText,
  SkeletonTitle,
  SkeletonAvatar,
  SkeletonCard,
  ProgressBar,
  LoadingOverlay,
  LoadingState,
  LoadingButton,
  PulseLoader,
  DotsLoader
}; 