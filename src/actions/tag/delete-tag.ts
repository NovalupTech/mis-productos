'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';
import { revalidatePath } from 'next/cache';

export const deleteTag = async (tagId: string) => {
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

    // Verificar que el tag pertenece a la compañía
    const existingTag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        companyId,
      },
    });

    if (!existingTag) {
      return {
        ok: false,
        message: 'Tag no encontrado'
      };
    }

    // Eliminar el tag (las relaciones ProductTag se eliminarán automáticamente por cascade)
    await prisma.tag.delete({
      where: {
        id: tagId,
      },
    });

    revalidatePath('/gestion/tags');

    return {
      ok: true,
      message: 'Tag eliminado correctamente',
    };
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'No se pudo eliminar el tag'
    };
  }
};
