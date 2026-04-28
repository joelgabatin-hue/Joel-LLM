import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[14px] font-medium text-[#111827] mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-3 py-2 bg-white border rounded-lg text-[14px] transition-colors
            ${error ? 'border-[#DC2626] focus:ring-2 focus:ring-[#DC2626] focus:ring-opacity-20' : 'border-[#D1D5DB] focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5] focus:ring-opacity-20'}
            disabled:bg-[#F3F4F6] disabled:cursor-not-allowed
            outline-none ${className}`}
          {...props}
        />
        {error && (
          <p className="text-[12px] text-[#DC2626] mt-1">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-[12px] text-[#4B5563] mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
