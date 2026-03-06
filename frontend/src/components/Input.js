/**
 * Clean Input component with variants and validation states
 */

import React, { useState, forwardRef } from 'react';
import { cn } from '../utils/helpers';

/**
 * Input component props
 * @typedef {Object} InputProps
 * @property {string} [type='text'] - Input type
 * @property {string} [placeholder] - Input placeholder
 * @property {string} [value] - Input value
 * @property {Function} [onChange] - Change handler
 * @property {Function} [onBlur] - Blur handler
 * @property {Function} [onFocus] - Focus handler
 * @property {string} [label] - Input label
 * @property {string} [error] - Error message
 * @property {string} [helper] - Helper text
 * @property {boolean} [required=false] - Required field
 * @property {boolean} [disabled=false] - Disabled state
 * @property {boolean} [readonly=false] - Readonly state
 * @property {string} [size='medium'] - Input size
 * @property {string} [variant='default'] - Input variant
 * @property {React.ReactNode} [leftIcon] - Left icon
 * @property {React.ReactNode} [rightIcon] - Right icon
 * @property {boolean} [fullWidth=false] - Full width
 * @property {string} [className] - Additional CSS classes
 * @property {Object} [style] - Inline styles
 * @property {string} [id] - Input ID
 * @property {string} [name] - Input name
 * @property {boolean} [autoFocus=false] - Auto focus
 * @property {number} [maxLength] - Max length
 * @property {number} [minLength] - Min length
 * @property {string} [pattern] - Input pattern
 * @property {boolean} [showPasswordToggle=false] - Show password toggle for password inputs
 */

/**
 * Input component with variants and validation states
 * @param {InputProps} props - Input props
 * @returns {JSX.Element} Input component
 */
const Input = forwardRef(({
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  label,
  error,
  helper,
  required = false,
  disabled = false,
  readonly = false,
  size = 'medium',
  variant = 'default',
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  style,
  id,
  name,
  autoFocus = false,
  maxLength,
  minLength,
  pattern,
  showPasswordToggle = false,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [inputType, setInputType] = useState(type);

  // Handle password toggle
  const handlePasswordToggle = () => {
    setShowPassword(!showPassword);
    setInputType(showPassword ? 'password' : 'text');
  };

  // Handle focus
  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  // Handle blur
  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Generate input ID if not provided
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  // Size classes
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-sm',
    large: 'px-4 py-3 text-base',
  };

  // Variant classes
  const variantClasses = {
    default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
    filled: 'bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-blue-500',
    outlined: 'border-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500',
    underlined: 'border-0 border-b-2 border-gray-300 rounded-none focus:border-blue-500 focus:ring-0',
  };

  // State classes
  const stateClasses = cn(
    'block w-full border rounded-md shadow-sm transition-all duration-200',
    disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed',
    readonly && 'bg-gray-50 text-gray-700 cursor-default',
    error && 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500',
    !error && isFocused && 'ring-1',
    variantClasses[variant],
    sizeClasses[size]
  );

  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';

  // Icon container classes
  const iconContainerClasses = 'absolute inset-y-0 flex items-center pointer-events-none';

  // Left icon container
  const leftIconContainer = leftIcon && (
    <div className={cn(iconContainerClasses, 'left-0 pl-3')}>
      {leftIcon}
    </div>
  );

  // Right icon container
  const rightIconContainer = rightIcon && (
    <div className={cn(iconContainerClasses, 'right-0 pr-3')}>
      {rightIcon}
    </div>
  );

  // Password toggle
  const passwordToggle = type === 'password' && showPasswordToggle && (
    <button
      type="button"
      className={cn(
        iconContainerClasses,
        'right-0 pr-3 pointer-events-auto',
        'text-gray-400 hover:text-gray-600 focus:outline-none'
      )}
      onClick={handlePasswordToggle}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
    >
      {showPassword ? (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29-3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
          />
        </svg>
      ) : (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      )}
    </button>
  );

  // Input padding classes
  const getPaddingClasses = () => {
    const basePadding = sizeClasses[size].split(' ')[0]; // Get padding classes
    let paddingLeft = basePadding;
    let paddingRight = basePadding;

    if (leftIcon) {
      paddingLeft = 'pl-10';
    }
    if (rightIcon || passwordToggle) {
      paddingRight = 'pr-10';
    }

    return cn(paddingLeft, paddingRight);
  };

  return (
    <div className={cn('relative', fullWidth ? 'w-full' : '', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'block text-sm font-medium text-gray-700 mb-1',
            required && 'after:content:["*"] after:ml-1 after:text-red-500',
            error && 'text-red-700'
          )}
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIconContainer}
        
        <input
          ref={ref}
          type={inputType}
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readonly}
          autoFocus={autoFocus}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          className={cn(
            stateClasses,
            getPaddingClasses(),
            widthClasses
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
          {...props}
        />

        {rightIconContainer}
        {passwordToggle}
      </div>

      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}

      {helper && !error && (
        <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500">
          {helper}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

/**
 * Textarea component
 * @param {Object} props - Component props
 * @param {number} [rows=4] - Number of rows
 * @param {number} [cols] - Number of columns
 * @param {boolean} [resize=true] - Resizable
 * @returns {JSX.Element} Textarea component
 */
export const Textarea = forwardRef(({
  rows = 4,
  cols,
  resize = true,
  className = '',
  ...props
}, ref) => {
  const resizeClasses = resize ? 'resize-y' : 'resize-none';

  return (
    <textarea
      ref={ref}
      rows={rows}
      cols={cols}
      className={cn(
        'block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200',
        resizeClasses,
        className
      )}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

/**
 * Select component
 * @param {Object} props - Component props
 * @param {Array} [options=[]] - Select options
 * @param {string} [placeholder] - Placeholder option
 * @param {boolean} [multiple=false] - Multiple select
 * @returns {JSX.Element} Select component
 */
export const Select = forwardRef(({
  options = [],
  placeholder,
  multiple = false,
  className = '',
  ...props
}, ref) => {
  return (
    <select
      ref={ref}
      multiple={multiple}
      className={cn(
        'block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200',
        multiple ? 'h-auto' : 'h-10',
        className
      )}
      {...props}
    >
      {placeholder && !multiple && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
});

Select.displayName = 'Select';

/**
 * Checkbox component
 * @param {Object} props - Component props
 * @param {boolean} [checked=false] - Checked state
 * @param {string} [label] - Checkbox label
 * @param {boolean} [indeterminate=false] - Indeterminate state
 * @returns {JSX.Element} Checkbox component
 */
export const Checkbox = forwardRef(({
  checked = false,
  label,
  indeterminate = false,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={cn('flex items-center', className)}>
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        className={cn(
          'h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500',
          'focus:outline-none focus:ring-2 focus:ring-offset-2'
        )}
        {...props}
      />
      {label && (
        <label className="ml-2 text-sm text-gray-700">
          {label}
        </label>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

/**
 * Radio component
 * @param {Object} props - Component props
 * @param {boolean} [checked=false] - Checked state
 * @param {string} [label] - Radio label
 * @returns {JSX.Element} Radio component
 */
export const Radio = forwardRef(({
  checked = false,
  label,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={cn('flex items-center', className)}>
      <input
        ref={ref}
        type="radio"
        checked={checked}
        className={cn(
          'h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500',
          'focus:outline-none focus:ring-2 focus:ring-offset-2'
        )}
        {...props}
      />
      {label && (
        <label className="ml-2 text-sm text-gray-700">
          {label}
        </label>
      )}
    </div>
  );
});

Radio.displayName = 'Radio';

/**
 * File input component
 * @param {Object} props - Component props
 * @param {Function} [onFileSelect] - File selection handler
 * @param {string[]} [accept] - Accepted file types
 * @param {boolean} [multiple=false] - Multiple files
 * @returns {JSX.Element} File input component
 */
export const FileInput = forwardRef(({
  onFileSelect,
  accept,
  multiple = false,
  className = '',
  ...props
}, ref) => {
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      setFileName(multiple ? `${files.length} files selected` : files[0].name);
      onFileSelect?.(files);
    } else {
      setFileName('');
    }
  };

  return (
    <div className={cn('relative', className)}>
      <input
        ref={ref}
        type="file"
        accept={accept?.join(',')}
        multiple={multiple}
        onChange={handleFileChange}
        className={cn(
          'block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100',
          'border border-gray-300 rounded-md cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
        )}
        {...props}
      />
      {fileName && (
        <div className="mt-1 text-sm text-gray-600">
          Selected: {fileName}
        </div>
      )}
    </div>
  );
});

FileInput.displayName = 'FileInput';

export default Input;
