import React from 'react';
import { HiOutlineExclamationCircle } from 'react-icons/hi';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const variantStyles = {
  danger: {
    icon: 'text-error-500',
    button: 'bg-error-500 hover:bg-error-600 text-white',
  },
  warning: {
    icon: 'text-warning-500',
    button: 'bg-warning-500 hover:bg-warning-600 text-white',
  },
  info: {
    icon: 'text-brand-500',
    button: 'bg-brand-500 hover:bg-brand-600 text-white',
  },
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title = 'Confirmation',
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative mx-4 w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-lg dark:border-gray-700 dark:bg-gray-800 animate-in fade-in zoom-in-95">
        <div className="flex flex-col items-center text-center">
          <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 ${styles.icon}`}>
            <HiOutlineExclamationCircle size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{title}</h3>
          <p className="text-theme-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>
          <div className="flex w-full gap-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 rounded-lg px-4 py-2.5 text-theme-sm font-medium transition-colors ${styles.button}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
