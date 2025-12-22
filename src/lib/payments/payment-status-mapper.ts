import { PaymentStatus } from '@prisma/client';

/**
 * Mapea los estados de Mercado Pago a nuestros estados de Payment
 */
export const mapMercadoPagoStatus = (mpStatus: string): PaymentStatus => {
  switch (mpStatus.toLowerCase()) {
    case 'approved':
      return 'approved';
    case 'pending':
    case 'authorized':
    case 'in_process':
    case 'in_mediation':
      return 'pending';
    case 'rejected':
      return 'rejected';
    case 'cancelled':
      return 'cancelled';
    case 'refunded':
    case 'charged_back':
      return 'refunded';
    default:
      return 'pending';
  }
};

/**
 * Mapea los estados de PayPal a nuestros estados de Payment
 */
export const mapPayPalStatus = (paypalStatus: string, eventType: string): PaymentStatus => {
  if (eventType === 'PAYMENT.CAPTURE.COMPLETED' || paypalStatus === 'COMPLETED') {
    return 'approved';
  }
  if (eventType === 'PAYMENT.CAPTURE.DENIED' || paypalStatus === 'DENIED') {
    return 'rejected';
  }
  if (paypalStatus === 'CANCELLED') {
    return 'cancelled';
  }
  if (paypalStatus === 'REFUNDED') {
    return 'refunded';
  }
  return 'pending';
};

