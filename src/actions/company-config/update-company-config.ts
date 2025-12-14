'use server';

import { middleware } from '@/auth.config';
import { getCompanyIdFromContext } from '@/lib/company-context';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

interface UpdateConfigData {
  key: string;
  value: any;
}

export const updateCompanyConfig = async (configs: UpdateConfigData[]) => {
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

    // Actualizar o crear cada configuración
    for (const config of configs) {
      await prisma.companyConfig.upsert({
        where: {
          companyId_key: {
            companyId,
            key: config.key,
          },
        },
        update: {
          value: config.value,
        },
        create: {
          companyId,
          key: config.key,
          value: config.value,
        },
      });
    }

    // Revalidar rutas relevantes según las keys actualizadas
    const keys = configs.map(c => c.key);
    if (keys.some(k => k.startsWith('theme.') || k.startsWith('catalog.'))) {
      revalidatePath('/gestion/appearance');
      revalidatePath('/catalog');
    }
    if (keys.some(k => k.startsWith('prices.'))) {
      revalidatePath('/gestion/prices');
      revalidatePath('/catalog');
    }

    return {
      ok: true,
      message: 'Configuraciones actualizadas correctamente',
    };
  } catch (error) {
    console.error('Error al actualizar configuraciones:', error);
    return {
      ok: false,
      message: 'Error al actualizar las configuraciones',
    };
  }
};
