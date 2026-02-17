import React from 'react';

interface BadgeProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

const variantClasses: Record<string, string> = {
  primary: 'bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400',
  secondary: 'bg-secondary-50 text-secondary-500 dark:bg-secondary-500/[0.12] dark:text-secondary-400',
  success: 'bg-success-50 text-success-600 dark:bg-success-500/[0.12] dark:text-success-400',
  warning: 'bg-warning-50 text-warning-600 dark:bg-warning-500/[0.12] dark:text-warning-400',
  danger: 'bg-error-50 text-error-600 dark:bg-error-500/[0.12] dark:text-error-400',
  info: 'bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400',
  neutral: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

const Badge: React.FC<BadgeProps> = ({ text, variant = 'neutral' }) => {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-theme-xs font-medium ${variantClasses[variant]}`}>
      {text}
    </span>
  );
};

export default Badge;
