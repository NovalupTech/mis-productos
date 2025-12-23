'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';
import { revalidatePath } from 'next/cache';

export const deleteAttributeValue = async (attributeValueId: string) => {
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

    // Verificar que el valor existe y pertenece a un atributo de la compañía
    const attributeValue = await prisma.attributeValue.findUnique({
      where: {
        id: attributeValueId,
      },
      include: {
        attribute: true,
      },
    });

    if (!attributeValue || attributeValue.attribute.companyId !== companyId) {
      return {
        ok: false,
        message: 'Valor no encontrado'
      };
    }

    // Eliminar el valor
    await prisma.attributeValue.delete({
      where: {
        id: attributeValueId,
      },
    });

    revalidatePath('/gestion/attributes');

    return {
      ok: true,
      message: 'Valor eliminado correctamente',
    };
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'No se pudo eliminar el valor'
    };
  }
};














