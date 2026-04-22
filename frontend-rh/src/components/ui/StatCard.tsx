import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

const colorMap = {
  primary: 'bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400',
  secondary: 'bg-secondary-50 text-secondary-500 dark:bg-secondary-500/[0.12] dark:text-secondary-400',
  success: 'bg-success-50 text-success-600 dark:bg-success-500/[0.12] dark:text-success-400',
  warning: 'bg-warning-50 text-warning-600 dark:bg-warning-500/[0.12] dark:text-warning-400',
  error: 'bg-error-50 text-error-600 dark:bg-error-500/[0.12] dark:text-error-400',
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  change,
  changeType = 'neutral',
  color = 'primary',
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-dark">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{value}</h3>
          {change && (
            <p
              className={`mt-2 text-theme-xs ${
                changeType === 'positive'
                  ? 'text-success-600 dark:text-success-400'
                  : changeType === 'negative'
                    ? 'text-error-600 dark:text-error-400'
                    : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {change}
            </p>
          )}
        </div>
        <div className={`rounded-xl p-3 ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
