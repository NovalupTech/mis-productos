'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';
import { revalidatePath } from 'next/cache';

export const deleteSection = async (sectionId: string) => {
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

    // Verificar que la sección pertenece a una página de la compañía
    const section = await prisma.pageSection.findFirst({
      where: {
        id: sectionId,
        page: {
          companyId,
        },
      },
    });

    if (!section) {
      return {
        ok: false,
        message: 'Sección no encontrada'
      };
    }

    // Eliminar la sección
    await prisma.pageSection.delete({
      where: {
        id: sectionId,
      },
    });

    revalidatePath('/gestion/pages');
    revalidatePath('/');

    return {
      ok: true,
      message: 'Sección eliminada correctamente'
    };
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'No se pudo eliminar la sección'
    };
  }
};
