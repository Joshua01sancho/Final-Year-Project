import React from 'react';

const Card = ({
  children,
  variant = 'default',
  size = 'md',
  interactive = false,
  hover = true,
  className = '',
  onClick,
  header,
  footer,
  icon,
  title,
  subtitle,
  status,
  loading = false,
  ...props
}) => {
  // Base card classes
  const baseClasses = 'bg-white rounded-xl shadow-md border border-gray-200 transition-all duration-300';
  
  // Variant classes
  const variantClasses = {
    default: 'bg-white border-gray-200',
    elevated: 'bg-white border-gray-200 shadow-lg',
    featured: 'bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200 shadow-lg',
    glass: 'bg-white/80 backdrop-blur-md border border-white/20 shadow-xl',
    dark: 'bg-gray-900 text-white border-gray-700',
    success: 'bg-gradient-to-br from-success-50 to-success-100 border-success-200',
    warning: 'bg-gradient-to-br from-warning-50 to-warning-100 border-warning-200',
    error: 'bg-gradient-to-br from-error-50 to-error-100 border-error-200'
  };
  
  // Size classes
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };
  
  // Interactive classes
  const interactiveClasses = interactive || onClick
    ? 'cursor-pointer hover:shadow-xl hover:-translate-y-2 active:translate-y-0'
    : '';
  
  // Hover classes
  const hoverClasses = hover && !interactive && !onClick
    ? 'hover:shadow-lg hover:-translate-y-1'
    : '';
  
  // Loading classes
  const loadingClasses = loading ? 'animate-pulse' : '';
  
  // Combine all classes
  const cardClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    interactiveClasses,
    hoverClasses,
    loadingClasses,
    className
  ].filter(Boolean).join(' ');
  
  // Status badge component
  const StatusBadge = ({ status }) => {
    if (!status) return null;
    
    const statusClasses = {
      active: 'badge-success',
      pending: 'badge-warning',
      completed: 'badge-primary',
      error: 'badge-error',
      inactive: 'badge-gray'
    };
    
    return (
      <span className={`badge ${statusClasses[status.type] || 'badge-gray'}`}>
        {status.icon && <status.icon className="h-3 w-3 mr-1" />}
        {status.text}
      </span>
    );
  };
  
  // Header component
  const CardHeader = () => {
    if (!header && !icon && !title && !subtitle && !status) return null;
    
    return (
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1">
          {icon && (
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <icon className="h-5 w-5 text-primary-600" />
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {status && (
          <div className="flex-shrink-0 ml-4">
            <StatusBadge status={status} />
          </div>
        )}
      </div>
    );
  };
  
  // Footer component
  const CardFooter = () => {
    if (!footer) return null;
    
    return (
      <div className="mt-6 pt-4 border-t border-gray-200">
        {footer}
      </div>
    );
  };
  
  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="skeleton-avatar"></div>
        <div className="flex-1 space-y-2">
          <div className="skeleton-title"></div>
          <div className="skeleton-text w-3/4"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="skeleton-text"></div>
        <div className="skeleton-text w-5/6"></div>
        <div className="skeleton-text w-4/6"></div>
      </div>
    </div>
  );
  
  // Card content
  const cardContent = (
    <>
      <CardHeader />
      <div className="flex-1">
        {loading ? <LoadingSkeleton /> : children}
      </div>
      <CardFooter />
    </>
  );
  
  // Render card
  if (onClick) {
    return (
      <div
        className={cardClasses}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        {...props}
      >
        {cardContent}
      </div>
    );
  }
  
  return (
    <div className={cardClasses} {...props}>
      {cardContent}
    </div>
  );
};

// Card sub-components for better organization
Card.Header = ({ children, className = '', ...props }) => (
  <div className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
);

Card.Body = ({ children, className = '', ...props }) => (
  <div className={`flex-1 ${className}`} {...props}>
    {children}
  </div>
);

Card.Footer = ({ children, className = '', ...props }) => (
  <div className={`mt-6 pt-4 border-t border-gray-200 ${className}`} {...props}>
    {children}
  </div>
);

Card.Title = ({ children, className = '', ...props }) => (
  <h3 className={`text-lg font-semibold text-gray-900 mb-1 ${className}`} {...props}>
    {children}
  </h3>
);

Card.Subtitle = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-gray-600 ${className}`} {...props}>
    {children}
  </p>
);

Card.Icon = ({ icon: Icon, className = '', ...props }) => (
  <div className={`w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center ${className}`} {...props}>
    <Icon className="h-5 w-5 text-primary-600" />
  </div>
);

export default Card; 