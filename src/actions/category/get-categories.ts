'use server';

import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';

export const getCategories = async (companyId?: string) => {
  try {
    // Si no se pasa companyId, obtenerlo del contexto (dominio)
    const finalCompanyId = companyId || await getCompanyIdFromContext();
    const where = finalCompanyId ? { companyId: finalCompanyId } : {};
    
    const categories = await prisma.category.findMany({
      where,
      orderBy: {
        name: 'asc'
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return categories;
  } catch (error) {
    console.log(error);
    return [];
  }
}
