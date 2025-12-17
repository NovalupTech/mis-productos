'use server';

import { middleware } from '@/auth.config';
import { getCompanyIdFromContext } from '@/lib/company-context';
import prisma from '@/lib/prisma';

export async function getPaymentMethods() {
  try {
    const session = await middleware();

    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'companyAdmin')) {
      return {
        ok: false,
        message: 'No autorizado',
        paymentMethods: [],
      };
    }

    const companyId = await getCompanyIdFromContext();
    if (!companyId) {
      return {
        ok: false,
        message: 'No se encontró la empresa del usuario',
        paymentMethods: [],
      };
    }

    const paymentMethods = await prisma.paymentMethod.findMany({
      where: {
        companyId,
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
