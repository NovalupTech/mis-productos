import { useConfirmStore } from '@/store/confirm/confirm-store';

/**
 * Muestra un diálogo de confirmación
 * @param title - Título del diálogo
 * @param message - Mensaje del diálogo
 * @param onConfirm - Función a ejecutar cuando se confirma
 * @param options - Opciones adicionales (confirmText, cancelText, type)
 * @returns Promise que se resuelve cuando el usuario confirma o cancela
 */
export const showConfirm = (
  title: string,
  message: string,
  onConfirm: () => void,
  options?: {
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  }
): Promise<boolean> => {
  return new Promise((resolve) => {
    useConfirmStore.getState().showConfirm(
      title,
      message,
      () => {
        onConfirm();
        resolve(true);
      },
      options
    );
  });
};

/**
 * Helper para confirmaciones de eliminación
 */
export const confirmDelete = (
  message: string,
  onConfirm: () => void
): Promise<boolean> => {
  return showConfirm(
    'Confirmar eliminación',
    message,
    onConfirm,
    {
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
    }
  );
};

