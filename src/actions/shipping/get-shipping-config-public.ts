'use server';

import prisma from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/domain';

/**
 * Obtiene la configuración de envíos para una empresa (público, sin autenticación)
 */
export async function getShippingConfigPublic(companyId: string) {
  try {
    if (!companyId) {
      return {
        ok: false,
        message: 'No se proporcionó el ID de la empresa',
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

    const enabled = enabledConfig?.value === true || enabledConfig?.value === 'true';
    const type = (typeConfig?.value as 'company' | 'none') || 'none';

    // Determinar si se manejan envíos
    const handlesShipping = enabled && type === 'company';

    return {
      ok: true,
      config: {
        enabled,
        type,
        handlesShipping,
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
