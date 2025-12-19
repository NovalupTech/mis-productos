'use server';

import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';

export const getAllAttributes = async (companyId?: string) => {
  try {
    // Si no se pasa companyId, obtenerlo del contexto (dominio)
    const finalCompanyId = companyId || await getCompanyIdFromContext();
    
    if (!finalCompanyId) {
      return {
        ok: false,
        attributes: [],
        message: 'No se pudo determinar la compañía'
      };
    }

    const attributes = await prisma.attribute.findMany({
      where: {
        companyId: finalCompanyId
      },
      include: {
        values: {
          orderBy: {
            value: 'asc'
          },
          select: {
            id: true,
            value: true,
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return {
      ok: true,
      attributes
    };
  } catch (error) {
    console.error('Error al obtener atributos:', error);
    return {
      ok: false,
      attributes: [],
      message: 'Error al obtener los atributos'
    };
  }
};








