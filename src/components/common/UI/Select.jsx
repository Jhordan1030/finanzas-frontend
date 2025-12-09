import React, { forwardRef } from 'react'
import { clsx } from 'clsx'

const Select = forwardRef(({ 
  label, 
  options = [],
  error, 
  helperText,
  className = '',
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={clsx(
          'w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500',
          error ? 'border-danger-500 focus:ring-danger-500' : 'border-gray-300 focus:border-transparent',
          className
        )}
        {...props}
      >
        <option value="">Seleccionar...</option>
        {options.map((option) => (
          <option key={option.value || option} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
      {(error || helperText) && (
        <p className={clsx(
          'mt-1 text-sm',
          error ? 'text-danger-600' : 'text-gray-500'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  )
})

Select.displayName = 'Select'

export default Select