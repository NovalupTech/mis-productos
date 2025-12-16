'use server';

import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';

export const getAllDiscounts = async () => {
  try {
    const companyId = await getCompanyIdFromContext();
    
    if (!companyId) {
      return {
        ok: false,
        discounts: [],
        message: 'No se pudo determinar la compañía'
      };
    }

    const discounts = await prisma.discount.findMany({
      include: {
        targets: {
          orderBy: {
            targetType: 'asc'
          }
        },
        conditions: {
          orderBy: {
            conditionType: 'asc'
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return {
      ok: true,
      discounts
    };
  } catch (error) {
    console.error('Error al obtener descuentos:', error);
    return {
      ok: false,
      discounts: [],
      message: 'Error al obtener los descuentos'
    };
  }
};
