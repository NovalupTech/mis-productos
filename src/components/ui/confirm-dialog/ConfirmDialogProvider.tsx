'use client';

import { useConfirmStore } from '@/store/confirm/confirm-store';
import { ConfirmDialog } from './ConfirmDialog';

export const ConfirmDialogProvider = () => {
  const { dialogs } = useConfirmStore();

  return (
    <>
      {dialogs.map((dialog) => (
        <ConfirmDialog
          key={dialog.id}
          isOpen={true}
          title={dialog.title}
          message={dialog.message}
          confirmText={dialog.confirmText}
          cancelText={dialog.cancelText}
          type={dialog.type}
          onConfirm={dialog.onConfirm}
          onCancel={dialog.onCancel}
        />
      ))}
    </>
  );
};

