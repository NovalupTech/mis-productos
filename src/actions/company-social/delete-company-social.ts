'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';
import { revalidatePath } from 'next/cache';

export const deleteCompanySocial = async (socialId: string) => {
  const session = await middleware();

  if (session?.user.role !== 'admin' && session?.user.role !== 'companyAdmin') {
    return {
      ok: false,
      message: 'Debe de ser un usuario administrador'
    };
  }

  try {
    const companyId = await getCompanyIdFromContext();

    if (!companyId) {
      return {
        ok: false,
        message: 'No se pudo determinar la compañía'
      };
    }

    // Verificar que la red social pertenezca a la compañía
    const existingSocial = await prisma.companySocial.findFirst({
      where: {
        id: socialId,
        companyId,
      },
    });

    if (!existingSocial) {
      return {
        ok: false,
        message: 'Red social no encontrada'
      };
    }

    await prisma.companySocial.delete({
      where: { id: socialId },
    });

    revalidatePath('/gestion/company');
    revalidatePath('/');
    return {
      ok: true,
      message: 'Red social eliminada correctamente'
    };
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'No se pudo eliminar la red social'
    };
  }
};
