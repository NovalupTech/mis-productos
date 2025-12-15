'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';
import { revalidatePath } from 'next/cache';
import { AttributeType } from '@prisma/client';

interface CreateAttributeData {
  name: string;
  type: AttributeType;
  required?: boolean;
}

export const createAttribute = async (data: CreateAttributeData) => {
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

    // Validar que el atributo no exista para esta compañía
    const existingAttribute = await prisma.attribute.findFirst({
      where: {
        name: data.name.trim(),
        companyId,
      },
    });

    if (existingAttribute) {
      return {
        ok: false,
        message: 'Ya existe un atributo con ese nombre'
      };
    }

    // Crear el atributo
    const newAttribute = await prisma.attribute.create({
      data: {
        name: data.name.trim(),
        type: data.type,
        required: data.required ?? false,
        companyId,
      },
      include: {
        values: true
      }
    });

    revalidatePath('/gestion/attributes');

    return {
      ok: true,
      message: 'Atributo creado correctamente',
      attribute: newAttribute,
    };
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'No se pudo crear el atributo'
    };
  }
};

