'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';
import { revalidatePath } from 'next/cache';

interface UpdateAttributeValueData {
  attributeValueId: string;
  value: string;
}

export const updateAttributeValue = async (data: UpdateAttributeValueData) => {
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
        id: data.attributeValueId,
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

    // Verificar que el nuevo valor no esté en uso por otro valor del mismo atributo
    const duplicateValue = await prisma.attributeValue.findFirst({
      where: {
        attributeId: attributeValue.attributeId,
        value: data.value.trim(),
        id: { not: data.attributeValueId },
      },
    });

    if (duplicateValue) {
      return {
        ok: false,
        message: 'Ya existe otro valor con ese nombre para este atributo'
      };
    }

    // Actualizar el valor
    const updatedValue = await prisma.attributeValue.update({
      where: {
        id: data.attributeValueId,
      },
      data: {
        value: data.value.trim(),
      },
    });

    revalidatePath('/gestion/attributes');

    return {
      ok: true,
      message: 'Valor actualizado correctamente',
      attributeValue: updatedValue,
    };
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'No se pudo actualizar el valor'
    };
  }
};






















