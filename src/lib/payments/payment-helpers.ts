'use server';

import prisma from '@/lib/prisma';
import { Payment, PaymentStatus } from '@prisma/client';
import { mapMercadoPagoStatus, mapPayPalStatus } from './payment-status-mapper';

// Re-exportar las funciones de mapeo para mantener compatibilidad
export { mapMercadoPagoStatus, mapPayPalStatus };

interface CreatePaymentParams {
  orderId: string;
  companyId: string;
  paymentId: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  status?: PaymentStatus;
  statusDetail?: string;
  externalReference?: string;
  metadata?: Record<string, any>;
}

interface UpdatePaymentParams {
  paymentId: string;
  status: PaymentStatus;
  statusDetail?: string;
  metadata?: Record<string, any>;
}

/**
 * Crea un nuevo registro de pago
 */
export const createPayment = async (params: CreatePaymentParams) => {
  try {
    const payment = await prisma.payment.create({
      data: {
        orderId: params.orderId,
        companyId: params.companyId,
        paymentId: params.paymentId,
        amount: params.amount,
        currency: params.currency || 'USD',
        paymentMethod: params.paymentMethod,
        status: params.status || 'pending',
        statusDetail: params.statusDetail,
        externalReference: params.externalReference,
        metadata: params.metadata || {},
      },
    });

    return { ok: true, payment };
  } catch (error) {
    console.error('Error al crear pago:', error);
    return { ok: false, error };
  }
};

/**
 * Busca un pago por paymentId (ID del proveedor)
 */
export const findPaymentByProviderId = async (paymentId: string) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: { paymentId },
      include: {
        order: {
          select: {
            id: true,
            companyId: true,
            total: true,
          },
        },
      },
    });

    return { ok: true, payment };
  } catch (error) {
    console.error('Error al buscar pago:', error);
    return { ok: false, error };
  }
};

/**
 * Busca un pago por orderId
 */
export const findPaymentByOrderId = async (orderId: string) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    return { ok: true, payment };
  } catch (error) {
    console.error('Error al buscar pago por orden:', error);
    return { ok: false, error };
  }
};

/**
 * Actualiza un pago existente
 */
export const updatePayment = async (id: string, params: UpdatePaymentParams) => {
  try {
    const payment = await prisma.payment.update({
      where: { id },
      data: {
        status: params.status,
        statusDetail: params.statusDetail,
        metadata: params.metadata ? { ...params.metadata } : undefined,
      },
    });

    return { ok: true, payment };
  } catch (error) {
    console.error('Error al actualizar pago:', error);
    return { ok: false, error };
  }
};

/**
 * Crea o actualiza un pago (upsert)
 * Busca primero por paymentId del proveedor, si no existe busca por orderId
 */
export const upsertPayment = async (
  providerPaymentId: string,
  params: CreatePaymentParams & { status: PaymentStatus }
) => {
  try {
    // Primero buscar por paymentId del proveedor
    let existingPayment = await findPaymentByProviderId(providerPaymentId);

    // Si no existe, buscar por orderId para ver si hay un pago pendiente
    if (!existingPayment.ok || !existingPayment.payment) {
      const orderPayment = await findPaymentByOrderId(params.orderId);
      if (orderPayment.ok && orderPayment.payment) {
        existingPayment = { ok: true, payment: orderPayment.payment as Payment & { order: { id: string; companyId: string; total: number } } };
      }
    }

    if (existingPayment.ok && existingPayment.payment) {
      // Actualizar pago existente
      return await updatePayment(existingPayment.payment.id, {
        paymentId: existingPayment.payment.paymentId,
        status: params.status,
        statusDetail: params.statusDetail,
        metadata: params.metadata,
      });
    } else {
      // Crear nuevo pago
      return await createPayment(params);
    }
  } catch (error) {
    console.error('Error en upsertPayment:', error);
    return { ok: false, error };
  }
};

/**
 * Crea un pago pendiente cuando se crea una orden
 */
export const createPendingPaymentForOrder = async (
  orderId: string,
  companyId: string,
  amount: number,
  currency: string = 'USD',
  externalReference?: string
) => {
  try {
    // Generar un paymentId temporal único
    const temporaryPaymentId = `pending_${orderId}_${Date.now()}`;

    return await createPayment({
      orderId,
      companyId,
      paymentId: temporaryPaymentId,
      amount,
      currency,
      status: 'pending',
      externalReference,
      metadata: {
        createdBy: 'order_creation',
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error al crear pago pendiente:', error);
    return { ok: false, error };
  }
};

