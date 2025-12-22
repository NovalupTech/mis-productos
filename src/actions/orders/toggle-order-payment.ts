'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { findPaymentByOrderId, upsertPayment } from '@/lib/payments/payment-helpers';
import { PaymentStatus } from '@prisma/client';

export const toggleOrderPayment = async (orderId: string, isPaid: boolean) => {
  const session = await middleware();

  if (session?.user.role !== 'admin' && session?.user.role !== 'companyAdmin') {
    return {
      ok: false,
      message: 'Debe de estar autenticado como admin'
    };
  }

  try {
    // Obtener información de la orden
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, companyId: true, total: true },
    });

    if (!order) {
      return {
        ok: false,
        message: 'Orden no encontrada'
      };
    }

    // Actualizar la orden
    await prisma.order.update({
      where: { id: orderId },
      data: {
        isPaid,
        paidAt: isPaid ? new Date() : null,
      },
    });

    // Buscar si existe un pago para esta orden
    const existingPayment = await findPaymentByOrderId(orderId);

    if (existingPayment.ok && existingPayment.payment) {
      // Actualizar el pago existente
      const paymentStatus: PaymentStatus = isPaid ? 'approved' : 'rejected';
      await upsertPayment(
        existingPayment.payment.paymentId,
        {
          orderId: order.id,
          companyId: order.companyId,
          paymentId: existingPayment.payment.paymentId,
          amount: order.total,
          currency: existingPayment.payment.currency,
          paymentMethod: existingPayment.payment.paymentMethod,
          status: paymentStatus,
          statusDetail: isPaid ? 'Marcado como pagado por admin' : 'Marcado como no pagado por admin',
          externalReference: orderId,
          metadata: {
            ...(existingPayment.payment.metadata as Record<string, any> || {}),
            adminUpdate: {
              updatedBy: session.user.id,
              updatedAt: new Date().toISOString(),
              reason: isPaid ? 'Marcado como pagado manualmente' : 'Marcado como no pagado manualmente',
            },
          },
        }
      );
    } else {
      // Crear un nuevo pago si no existe
      const paymentStatus: PaymentStatus = isPaid ? 'approved' : 'pending';
      const adminPaymentId = `admin_${orderId}_${Date.now()}`;
      
      await upsertPayment(
        adminPaymentId,
        {
          orderId: order.id,
          companyId: order.companyId,
          paymentId: adminPaymentId,
          amount: order.total,
          currency: 'USD',
          paymentMethod: 'admin_manual',
          status: paymentStatus,
          statusDetail: isPaid ? 'Marcado como pagado por admin' : 'Creado como pendiente por admin',
          externalReference: orderId,
          metadata: {
            createdBy: 'admin',
            adminUpdate: {
              updatedBy: session.user.id,
              updatedAt: new Date().toISOString(),
              reason: isPaid ? 'Marcado como pagado manualmente' : 'Creado manualmente',
            },
          },
        }
      );
    }

    revalidatePath('/gestion/orders');
    revalidatePath(`/catalog/orders/${orderId}`);

    return {
      ok: true,
      message: `Orden ${isPaid ? 'marcada como pagada' : 'marcada como no pagada'}`
    };
  } catch (error) {
    console.error('Error al actualizar estado de pago:', error);
    return {
      ok: false,
      message: 'No se pudo actualizar el estado de pago'
    };
  }
};

