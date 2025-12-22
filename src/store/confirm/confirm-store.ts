import { create } from 'zustand';

export interface ConfirmDialog {
  id: string;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

interface ConfirmState {
  dialogs: ConfirmDialog[];
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      confirmText?: string;
      cancelText?: string;
      type?: 'danger' | 'warning' | 'info';
    }
  ) => void;
  removeDialog: (id: string) => void;
}

export const useConfirmStore = create<ConfirmState>((set) => ({
  dialogs: [],
  showConfirm: (title, message, onConfirm, options = {}) => {
    const id = Math.random().toString(36).substring(2, 9);
    const {
      confirmText = 'Confirmar',
      cancelText = 'Cancelar',
      type = 'warning',
    } = options;

    const dialog: ConfirmDialog = {
      id,
      title,
      message,
      confirmText,
      cancelText,
      type,
      onConfirm: () => {
        onConfirm();
        set((state) => ({
          dialogs: state.dialogs.filter((d) => d.id !== id),
        }));
      },
      onCancel: () => {
        set((state) => ({
          dialogs: state.dialogs.filter((d) => d.id !== id),
        }));
      },
    };

    set((state) => ({
      dialogs: [...state.dialogs, dialog],
    }));
  },
  removeDialog: (id) => {
    set((state) => ({
      dialogs: state.dialogs.filter((d) => d.id !== id),
    }));
  },
}));

