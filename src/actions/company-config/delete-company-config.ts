'use server';

import { middleware } from '@/auth.config';
import { getCompanyIdFromContext } from '@/lib/company-context';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Elimina una configuración específica de la empresa (restaura al valor por defecto)
 */
export const deleteCompanyConfig = async (key: string) => {
  try {
    const session = await middleware();

    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'companyAdmin')) {
      return {
        ok: false,
        message: 'No autorizado',
      };
    }

    const companyId = await getCompanyIdFromContext();
    if (!companyId) {
      return {
        ok: false,
        message: 'No se encontró la empresa del usuario',
      };
    }

    // Eliminar la configuración
    await prisma.companyConfig.deleteMany({
      where: {
        companyId,
        key,
      },
    });

    revalidatePath('/gestion/appearance');
    revalidatePath('/catalog');

    return {
      ok: true,
      message: 'Configuración restaurada al valor por defecto',
    };
  } catch (error) {
    console.error('Error al eliminar configuración:', error);
    return {
      ok: false,
      message: 'Error al eliminar la configuración',
    };
  }
};
