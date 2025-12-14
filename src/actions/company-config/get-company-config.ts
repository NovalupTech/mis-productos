'use server';

import { middleware } from '@/auth.config';
import { getCompanyIdFromContext } from '@/lib/company-context';
import prisma from '@/lib/prisma';

export const getCompanyConfig = async () => {
  try {
    const session = await middleware();

    if (!session?.user || session.user.role !== 'admin' && session.user.role !== 'companyAdmin') {
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

    // Obtener todas las configuraciones de la empresa
    const configs = await prisma.companyConfig.findMany({
      where: {
        companyId,
      },
      orderBy: {
        key: 'asc',
      },
    });

    // Convertir array a objeto para facilitar el uso
    const configMap: Record<string, any> = {};
    configs.forEach((config) => {
      configMap[config.key] = config.value;
    });

    return {
      ok: true,
      configs: configMap,
    };
  } catch (error) {
    console.error('Error al obtener configuraciones:', error);
    return {
      ok: false,
      message: 'Error al obtener las configuraciones',
    };
  }
};
