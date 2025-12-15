'use server';

import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';

export const getAllTags = async (companyId?: string) => {
  try {
    // Si no se pasa companyId, obtenerlo del contexto (dominio)
    const finalCompanyId = companyId || await getCompanyIdFromContext();
    
    if (!finalCompanyId) {
      return {
        ok: false,
        tags: [],
        message: 'No se pudo determinar la compañía'
      };
    }

    const tags = await prisma.tag.findMany({
      where: {
        companyId: finalCompanyId
      },
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      }
    });

    return {
      ok: true,
      tags
    };
  } catch (error) {
    console.error('Error al obtener tags:', error);
    return {
      ok: false,
      tags: [],
      message: 'Error al obtener los tags'
    };
  }
};
