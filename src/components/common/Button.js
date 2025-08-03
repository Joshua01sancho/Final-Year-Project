import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  href,
  target,
  rel,
  ...props
}) => {
  // Base button classes
  const baseClasses = 'btn inline-flex items-center justify-center font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 focus:ring-primary-500 shadow-lg hover:shadow-xl border-transparent',
    secondary: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-500 shadow-md hover:shadow-lg',
    success: 'bg-gradient-to-r from-success-600 to-success-700 text-white hover:from-success-700 hover:to-success-800 focus:ring-success-500 shadow-lg hover:shadow-xl border-transparent',
    warning: 'bg-gradient-to-r from-warning-600 to-warning-700 text-white hover:from-warning-700 hover:to-warning-800 focus:ring-warning-500 shadow-lg hover:shadow-xl border-transparent',
    error: 'bg-gradient-to-r from-error-600 to-error-700 text-white hover:from-error-700 hover:to-error-800 focus:ring-error-500 shadow-lg hover:shadow-xl border-transparent',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 border-transparent shadow-none hover:shadow-md',
    outline: 'bg-transparent border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white focus:ring-primary-500',
    link: 'bg-transparent text-primary-600 hover:text-primary-700 underline border-transparent shadow-none hover:shadow-none p-0'
  };
  
  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };
  
  // State classes
  const stateClasses = disabled || loading 
    ? 'opacity-50 cursor-not-allowed transform-none hover:scale-100' 
    : '';
  
  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';
  
  // Combine all classes
  const buttonClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    stateClasses,
    widthClasses,
    className
  ].filter(Boolean).join(' ');
  
  // Icon component
  const IconComponent = icon;
  
  // Loading spinner
  const LoadingSpinner = () => (
    <Loader2 className="animate-spin h-4 w-4" />
  );
  
  // Content with icon and loading state
  const renderContent = () => {
    if (loading) {
      return (
        <>
          <LoadingSpinner />
          <span className="ml-2">{children}</span>
        </>
      );
    }
    
    if (icon && iconPosition === 'left') {
      return (
        <>
          <IconComponent className="h-4 w-4 mr-2" />
          <span>{children}</span>
        </>
      );
    }
    
    if (icon && iconPosition === 'right') {
      return (
        <>
          <span>{children}</span>
          <IconComponent className="h-4 w-4 ml-2" />
        </>
      );
    }
    
    return <span>{children}</span>;
  };
  
  // If href is provided, render as Link
  if (href) {
    const LinkComponent = require('next/link').default;
    return (
      <LinkComponent
        href={href}
        target={target}
        rel={rel}
        className={buttonClasses}
        onClick={onClick}
        {...props}
      >
        {renderContent()}
      </LinkComponent>
    );
  }
  
  // Render as button
  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {renderContent()}
    </button>
  );
};

export default Button; 