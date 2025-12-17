'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';
import { revalidatePath } from 'next/cache';

export const deleteAttribute = async (attributeId: string) => {
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

    // Verificar que el atributo pertenece a la compañía
    const existingAttribute = await prisma.attribute.findFirst({
      where: {
        id: attributeId,
        companyId,
      },
    });

    if (!existingAttribute) {
      return {
        ok: false,
        message: 'Atributo no encontrado'
      };
    }

    // Eliminar el atributo (los valores se eliminarán automáticamente por cascade)
    await prisma.attribute.delete({
      where: {
        id: attributeId,
      },
    });

    revalidatePath('/gestion/attributes');

    return {
      ok: true,
      message: 'Atributo eliminado correctamente',
    };
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'No se pudo eliminar el atributo'
    };
  }
};




