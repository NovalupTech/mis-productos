'use server';

import { middleware } from '@/auth.config';
import { getCompanyIdFromContext } from '@/lib/company-context';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

interface CreateCategoryData {
  name: string;
}

export async function createCategory(data: CreateCategoryData) {
  try {
    const session = await middleware();

    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'companyAdmin')) {
      return {
        ok: false,
        message: 'No autorizado',
      };
    }

    const companyId = await getCompanyIdFromContext();
    if (!companyId) {
      return {
        ok: false,
        message: 'No se encontró la empresa del usuario',
      };
    }

    // Verificar si ya existe una categoría con el mismo nombre para esta empresa
    const existingCategory = await prisma.category.findUnique({
      where: {
        name_companyId: {
          name: data.name.trim(),
          companyId,
        },
      },
    });

    if (existingCategory) {
      return {
        ok: false,
        message: 'Ya existe una categoría con ese nombre',
      };
    }

    const category = await prisma.category.create({
      data: {
        name: data.name.trim(),
        companyId,
      },
    });

    revalidatePath('/gestion/product');
    revalidatePath('/gestion/products');
    revalidatePath('/gestion/tags');

    return {
      ok: true,
      category,
    };
  } catch (error) {
    console.error('Error al crear categoría:', error);
    return {
      ok: false,
      message: 'Error al crear la categoría',
    };
  }
}
