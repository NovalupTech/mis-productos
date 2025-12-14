'use server';

import prisma from '@/lib/prisma';

/**
 * Obtiene las configuraciones de una empresa (público, sin autenticación)
 */
export const getCompanyConfigPublic = async (companyId: string) => {
  try {
    if (!companyId) {
      return {
        ok: false,
        message: 'No se proporcionó el ID de la empresa',
        configs: {},
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
      configs: {},
    };
  }
};
