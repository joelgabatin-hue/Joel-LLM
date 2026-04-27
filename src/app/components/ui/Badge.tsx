import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'neutral';
  className?: string;
}

export default function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  const variants = {
    primary: 'bg-[#EEF2FF] text-[#4F46E5]',
    success: 'bg-[#DCFCE7] text-[#16A34A]',
    danger: 'bg-[#FEE2E2] text-[#DC2626]',
    warning: 'bg-[#FEF3C7] text-[#D97706]',
    neutral: 'bg-[#F3F4F6] text-[#4B5563]'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
