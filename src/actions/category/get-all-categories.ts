'use server';

import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';

export const getAllCategories = async (companyId?: string) => {
  try {
    // Si no se pasa companyId, obtenerlo del contexto (dominio)
    const finalCompanyId = companyId || await getCompanyIdFromContext();
    
    if (!finalCompanyId) {
      return {
        ok: false,
        categories: [],
        message: 'No se pudo determinar la compañía'
      };
    }

    const categories = await prisma.category.findMany({
      where: {
        companyId: finalCompanyId
      },
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        companyId: true,
      }
    });

    return {
      ok: true,
      categories
    };
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    return {
      ok: false,
      categories: [],
      message: 'Error al obtener las categorías'
    };
  }
};
