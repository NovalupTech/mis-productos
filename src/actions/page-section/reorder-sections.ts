'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';
import { revalidatePath } from 'next/cache';

interface ReorderSectionsData {
  pageId: string;
  sectionIds: string[]; // Array de IDs en el nuevo orden
}

export const reorderSections = async (data: ReorderSectionsData) => {
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

    // Verificar que la página pertenece a la compañía
    const page = await prisma.page.findFirst({
      where: {
        id: data.pageId,
        companyId,
      },
    });

    if (!page) {
      return {
        ok: false,
        message: 'Página no encontrada'
      };
    }

    // Actualizar las posiciones de las secciones
    await Promise.all(
      data.sectionIds.map((sectionId, index) =>
        prisma.pageSection.update({
          where: { id: sectionId },
          data: { position: index + 1 },
        })
      )
    );

    revalidatePath('/gestion/pages');
    revalidatePath('/');

    return {
      ok: true,
      message: 'Secciones reordenadas correctamente'
    };
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'No se pudieron reordenar las secciones'
    };
  }
};
