import { useToastStore } from '@/store/toast/toast-store';
import { ToastType } from '@/store/toast/toast-store';

/**
 * Muestra una notificación toast
 * @param message - Mensaje a mostrar
 * @param type - Tipo de toast (success, error, warning, info)
 * @param duration - Duración en milisegundos (default: 3000)
 */
export const showToast = (
  message: string,
  type: ToastType = 'info',
  duration: number = 3000
) => {
  useToastStore.getState().addToast(message, type, duration);
};

/**
 * Muestra un toast de éxito
 */
export const showSuccessToast = (message: string, duration?: number) => {
  showToast(message, 'success', duration);
};

/**
 * Muestra un toast de error
 */
export const showErrorToast = (message: string, duration?: number) => {
  showToast(message, 'error', duration || 4000);
};

/**
 * Muestra un toast de advertencia
 */
export const showWarningToast = (message: string, duration?: number) => {
  showToast(message, 'warning', duration);
};

/**
 * Muestra un toast informativo
 */
export const showInfoToast = (message: string, duration?: number) => {
  showToast(message, 'info', duration);
};

