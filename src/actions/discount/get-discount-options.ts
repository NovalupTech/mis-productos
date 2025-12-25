'use server';

import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';

export const getDiscountOptions = async () => {
  try {
    const companyId = await getCompanyIdFromContext();
    
    if (!companyId) {
      return {
        ok: false,
        products: [],
        categories: [],
        tags: [],
        message: 'No se pudo determinar la compañía'
      };
    }

    const [products, categories, tags] = await Promise.all([
      prisma.product.findMany({
        where: { 
          companyId,
          active: true,
        },
        select: {
          id: true,
          title: true,
        },
        orderBy: {
          title: 'asc'
        }
      }),
      prisma.category.findMany({
        where: { companyId },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc'
        }
      }),
      prisma.tag.findMany({
        where: { companyId },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc'
        }
      })
    ]);

    return {
      ok: true,
      products,
      categories,
      tags
    };
  } catch (error) {
    console.error('Error al obtener opciones para descuentos:', error);
    return {
      ok: false,
      products: [],
      categories: [],
      tags: [],
      message: 'Error al obtener las opciones'
    };
  }
};
