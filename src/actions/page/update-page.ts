'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';
import { revalidatePath } from 'next/cache';

interface UpdatePageData {
  pageId: string;
  slug?: string;
  title?: string;
  enabled?: boolean;
  isLanding?: boolean;
}

export const updatePage = async (data: UpdatePageData) => {
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
    const existingPage = await prisma.page.findFirst({
      where: {
        id: data.pageId,
        companyId,
      },
    });

    if (!existingPage) {
      return {
        ok: false,
        message: 'Página no encontrada'
      };
    }

    // Si se está marcando como landing, desmarcar las demás
    if (data.isLanding === true) {
      await prisma.page.updateMany({
        where: {
          companyId,
          id: { not: data.pageId },
        },
        data: {
          isLanding: false,
        },
      });
    }

    // Actualizar la página
    const updateData: Partial<UpdatePageData> = {};
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.enabled !== undefined) updateData.enabled = data.enabled;
    if (data.isLanding !== undefined) updateData.isLanding = data.isLanding;

    await prisma.page.update({
      where: {
        id: data.pageId,
      },
      data: updateData,
    });

    revalidatePath('/gestion/pages');
    revalidatePath('/');

    return {
      ok: true,
      message: 'Página actualizada correctamente'
    };
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'No se pudo actualizar la página'
    };
  }
};
