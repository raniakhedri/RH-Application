import { useState, useCallback } from 'react';

interface ConfirmState {
  isOpen: boolean;
  message: string;
  title: string;
  onConfirm: () => void;
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    message: '',
    title: 'Confirmation',
    onConfirm: () => {},
  });

  const confirm = useCallback((message: string, onConfirm: () => void, title = 'Confirmation') => {
    setState({ isOpen: true, message, title, onConfirm });
  }, []);

  const handleConfirm = useCallback(() => {
    state.onConfirm();
    setState(s => ({ ...s, isOpen: false }));
  }, [state.onConfirm]);

  const handleCancel = useCallback(() => {
    setState(s => ({ ...s, isOpen: false }));
  }, []);

  return {
    confirmState: state,
    confirm,
    handleConfirm,
    handleCancel,
  };
}
