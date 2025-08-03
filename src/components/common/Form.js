import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

// Input Component
export const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  success,
  disabled = false,
  required = false,
  className = '',
  icon,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;
  const hasError = !!error;
  const hasSuccess = !!success;

  const inputClasses = [
    'input',
    hasError && 'input-error',
    hasSuccess && 'input-success',
    isFocused && 'ring-2 ring-primary-500',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="form-group">
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`${inputClasses} ${icon ? 'pl-10' : ''}`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${props.id || 'input'}-error` : undefined}
          {...props}
        />
        
        {type === 'password' && (
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
        
        {hasError && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-error-500">
            <AlertCircle className="h-4 w-4" />
          </div>
        )}
        
        {hasSuccess && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-success-500">
            <CheckCircle className="h-4 w-4" />
          </div>
        )}
      </div>
      
      {hasError && (
        <p id={`${props.id || 'input'}-error`} className="text-error-600 text-sm mt-1 flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          {error}
        </p>
      )}
      
      {hasSuccess && (
        <p className="text-success-600 text-sm mt-1 flex items-center">
          <CheckCircle className="h-3 w-3 mr-1" />
          {success}
        </p>
      )}
    </div>
  );
};

// Select Component
export const Select = ({
  label,
  value,
  onChange,
  options = [],
  placeholder,
  error,
  success,
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasError = !!error;
  const hasSuccess = !!success;

  const selectClasses = [
    'input',
    hasError && 'input-error',
    hasSuccess && 'input-success',
    isFocused && 'ring-2 ring-primary-500',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="form-group">
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={selectClasses}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${props.id || 'select'}-error` : undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {hasError && (
        <p id={`${props.id || 'select'}-error`} className="text-error-600 text-sm mt-1 flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          {error}
        </p>
      )}
      
      {hasSuccess && (
        <p className="text-success-600 text-sm mt-1 flex items-center">
          <CheckCircle className="h-3 w-3 mr-1" />
          {success}
        </p>
      )}
    </div>
  );
};

// Checkbox Component
export const Checkbox = ({
  label,
  checked,
  onChange,
  error,
  success,
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  const hasError = !!error;
  const hasSuccess = !!success;

  return (
    <div className="form-group">
      <label className="flex items-start space-x-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 ${className}`}
          aria-invalid={hasError}
          {...props}
        />
        <span className="text-sm text-gray-700">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </span>
      </label>
      
      {hasError && (
        <p className="text-error-600 text-sm mt-1 flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          {error}
        </p>
      )}
      
      {hasSuccess && (
        <p className="text-success-600 text-sm mt-1 flex items-center">
          <CheckCircle className="h-3 w-3 mr-1" />
          {success}
        </p>
      )}
    </div>
  );
};

// Textarea Component
export const Textarea = ({
  label,
  value,
  onChange,
  placeholder,
  error,
  success,
  disabled = false,
  required = false,
  rows = 4,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasError = !!error;
  const hasSuccess = !!success;

  const textareaClasses = [
    'input',
    hasError && 'input-error',
    hasSuccess && 'input-success',
    isFocused && 'ring-2 ring-primary-500',
    'resize-none',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="form-group">
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        className={textareaClasses}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${props.id || 'textarea'}-error` : undefined}
        {...props}
      />
      
      {hasError && (
        <p id={`${props.id || 'textarea'}-error`} className="text-error-600 text-sm mt-1 flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          {error}
        </p>
      )}
      
      {hasSuccess && (
        <p className="text-success-600 text-sm mt-1 flex items-center">
          <CheckCircle className="h-3 w-3 mr-1" />
          {success}
        </p>
      )}
    </div>
  );
};

// Form Container
export const Form = ({ children, onSubmit, className = '', ...props }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className={className} {...props}>
      {children}
    </form>
  );
};

// Form Group
export const FormGroup = ({ children, className = '', ...props }) => {
  return (
    <div className={`space-y-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

// Form Actions
export const FormActions = ({ children, className = '', ...props }) => {
  return (
    <div className={`flex items-center justify-end space-x-4 pt-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export default {
  Input,
  Select,
  Checkbox,
  Textarea,
  Form,
  FormGroup,
  FormActions
}; 