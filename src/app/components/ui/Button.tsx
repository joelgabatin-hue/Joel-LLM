import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[#4F46E5] text-white hover:bg-[#3730A3] disabled:hover:bg-[#4F46E5]',
    secondary: 'bg-[#F3F4F6] text-[#111827] hover:bg-[#D1D5DB] border border-[#D1D5DB]',
    ghost: 'bg-transparent text-[#4B5563] hover:bg-[#F3F4F6]',
    danger: 'bg-[#DC2626] text-white hover:bg-[#B91C1C] disabled:hover:bg-[#DC2626]'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-[12px]',
    md: 'px-4 py-2 text-[14px]',
    lg: 'px-6 py-3 text-[14px]'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
