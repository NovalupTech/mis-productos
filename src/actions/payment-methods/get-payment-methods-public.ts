'use server';

import prisma from '@/lib/prisma';

/**
 * Obtiene los métodos de pago habilitados para una empresa (público, sin autenticación)
 */
export async function getPaymentMethodsPublic(companyId: string) {
  try {
    if (!companyId) {
      return {
        ok: false,
        message: 'No se proporcionó el ID de la empresa',
        paymentMethods: [],
      };
    }

    const paymentMethods = await prisma.paymentMethod.findMany({
      where: {
        companyId,
        enabled: true,
      },
      orderBy: {
        type: 'asc',
      },
    });

    return {
      ok: true,
      paymentMethods,
    };
  } catch (error) {
    console.error('Error al obtener métodos de pago:', error);
    return {
      ok: false,
      message: 'Error al obtener métodos de pago',
      paymentMethods: [],
    };
  }
}
