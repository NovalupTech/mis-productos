'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';
import { revalidatePath } from 'next/cache';

interface CreateAttributeValueData {
  attributeId: string;
  value: string;
}

export const createAttributeValue = async (data: CreateAttributeValueData) => {
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
    const attribute = await prisma.attribute.findFirst({
      where: {
        id: data.attributeId,
        companyId,
      },
    });

    if (!attribute) {
      return {
        ok: false,
        message: 'Atributo no encontrado'
      };
    }

    // Verificar que el valor no exista para este atributo
    const existingValue = await prisma.attributeValue.findFirst({
      where: {
        attributeId: data.attributeId,
        value: data.value.trim(),
      },
    });

    if (existingValue) {
      return {
        ok: false,
        message: 'Ya existe un valor con ese nombre para este atributo'
      };
    }

    // Crear el valor
    const newValue = await prisma.attributeValue.create({
      data: {
        value: data.value.trim(),
        attributeId: data.attributeId,
      },
    });

    revalidatePath('/gestion/attributes');

    return {
      ok: true,
      message: 'Valor creado correctamente',
      attributeValue: newValue,
    };
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'No se pudo crear el valor'
    };
  }
};














