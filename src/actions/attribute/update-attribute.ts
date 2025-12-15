'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';
import { revalidatePath } from 'next/cache';
import { AttributeType } from '@prisma/client';

interface UpdateAttributeData {
  attributeId: string;
  name: string;
  type: AttributeType;
}

export const updateAttribute = async (data: UpdateAttributeData) => {
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
        id: data.attributeId,
        companyId,
      },
    });

    if (!existingAttribute) {
      return {
        ok: false,
        message: 'Atributo no encontrado'
      };
    }

    // Validar que el nuevo nombre no esté en uso por otro atributo de la misma compañía
    const duplicateAttribute = await prisma.attribute.findFirst({
      where: {
        AND: [
          {
            name: data.name.trim(),
            companyId,
          },
          {
            id: { not: data.attributeId },
          },
        ],
      },
    });

    if (duplicateAttribute) {
      return {
        ok: false,
        message: 'Ya existe otro atributo con ese nombre'
      };
    }

    // Actualizar el atributo
    const updatedAttribute = await prisma.attribute.update({
      where: {
        id: data.attributeId,
      },
      data: {
        name: data.name.trim(),
        type: data.type,
      },
      include: {
        values: true
      }
    });

    revalidatePath('/gestion/attributes');

    return {
      ok: true,
      message: 'Atributo actualizado correctamente',
      attribute: updatedAttribute,
    };
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'No se pudo actualizar el atributo'
    };
  }
};

