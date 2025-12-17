'use server';

import { middleware } from '@/auth.config';
import { getCompanyIdFromContext } from '@/lib/company-context';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

interface UpdateShippingConfigData {
  enabled: boolean;
  type: 'company' | 'none';
}

export async function updateShippingConfig(data: UpdateShippingConfigData) {
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

    // Actualizar o crear configuraciones de envío
    await prisma.companyConfig.upsert({
      where: {
        companyId_key: {
          companyId,
          key: 'shipping.enabled',
        },
      },
      update: {
        value: data.enabled,
      },
      create: {
        companyId,
        key: 'shipping.enabled',
        value: data.enabled,
      },
    });

    await prisma.companyConfig.upsert({
      where: {
        companyId_key: {
          companyId,
          key: 'shipping.type',
        },
      },
      update: {
        value: data.type,
      },
      create: {
        companyId,
        key: 'shipping.type',
        value: data.type,
      },
    });

    revalidatePath('/gestion/shippings');
    revalidatePath('/catalog');

    return {
      ok: true,
      message: 'Configuración de envíos actualizada correctamente',
    };
  } catch (error) {
    console.error('Error al actualizar configuración de envíos:', error);
    return {
      ok: false,
      message: 'Error al actualizar la configuración de envíos',
    };
  }
}
