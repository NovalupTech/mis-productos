'use server';

import { middleware } from '@/auth.config';
import { getCompanyIdFromContext } from '@/lib/company-context';
import prisma from '@/lib/prisma';

export async function getShippingConfig() {
  try {
    const session = await middleware();

    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'companyAdmin')) {
      return {
        ok: false,
        message: 'No autorizado',
        config: null,
      };
    }

    const companyId = await getCompanyIdFromContext();
    if (!companyId) {
      return {
        ok: false,
        message: 'No se encontró la empresa del usuario',
        config: null,
      };
    }

    // Obtener configuraciones de envío
    const enabledConfig = await prisma.companyConfig.findUnique({
      where: {
        companyId_key: {
          companyId,
          key: 'shipping.enabled',
        },
      },
    });

    const typeConfig = await prisma.companyConfig.findUnique({
      where: {
        companyId_key: {
          companyId,
          key: 'shipping.type',
        },
      },
    });

    return {
      ok: true,
      config: {
        enabled: enabledConfig?.value === true || enabledConfig?.value === 'true',
        type: (typeConfig?.value as 'company' | 'none') || 'none',
      },
    };
  } catch (error) {
    console.error('Error al obtener configuración de envíos:', error);
    return {
      ok: false,
      message: 'Error al obtener la configuración de envíos',
      config: null,
    };
  }
}
