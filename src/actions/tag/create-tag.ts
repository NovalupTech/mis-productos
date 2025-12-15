'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';
import { revalidatePath } from 'next/cache';

interface CreateTagData {
  name: string;
}

export const createTag = async (data: CreateTagData) => {
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

    // Validar que el tag no exista para esta compañía
    const existingTag = await prisma.tag.findUnique({
      where: {
        name_companyId: {
          name: data.name.trim(),
          companyId,
        },
      },
    });

    if (existingTag) {
      return {
        ok: false,
        message: 'Ya existe un tag con ese nombre'
      };
    }

    // Crear el tag
    const newTag = await prisma.tag.create({
      data: {
        name: data.name.trim(),
        companyId,
      },
    });

    revalidatePath('/gestion/tags');

    return {
      ok: true,
      message: 'Tag creado correctamente',
      tag: newTag,
    };
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'No se pudo crear el tag'
    };
  }
};
