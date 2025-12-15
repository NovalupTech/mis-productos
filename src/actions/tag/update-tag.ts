'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';
import { revalidatePath } from 'next/cache';

interface UpdateTagData {
  tagId: string;
  name: string;
}

export const updateTag = async (data: UpdateTagData) => {
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
        id: data.tagId,
        companyId,
      },
    });

    if (!existingTag) {
      return {
        ok: false,
        message: 'Tag no encontrado'
      };
    }

    // Validar que el nuevo nombre no esté en uso por otro tag de la misma compañía
    const duplicateTag = await prisma.tag.findFirst({
      where: {
        AND: {
          name: data.name.trim(),
          companyId,
        },
        id: { not: data.tagId },
      },
    });

    if (duplicateTag) {
      return {
        ok: false,
        message: 'Ya existe otro tag con ese nombre'
      };
    }

    // Actualizar el tag
    const updatedTag = await prisma.tag.update({
      where: {
        id: data.tagId,
      },
      data: {
        name: data.name.trim(),
      },
    });

    revalidatePath('/gestion/tags');

    return {
      ok: true,
      message: 'Tag actualizado correctamente',
      tag: updatedTag,
    };
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'No se pudo actualizar el tag'
    };
  }
};
