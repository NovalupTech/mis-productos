'use server';

import { middleware } from '@/auth.config';
import { getCompanyIdFromContext } from '@/lib/company-context';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

interface UpdateCategoryData {
  id: string;
  name: string;
}

export async function updateCategory(data: UpdateCategoryData) {
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

    // Verificar que la categoría pertenezca a la empresa del usuario
    const existingCategory = await prisma.category.findUnique({
      where: { id: data.id },
    });

    if (!existingCategory) {
      return {
        ok: false,
        message: 'Categoría no encontrada',
      };
    }

    if (existingCategory.companyId !== companyId) {
      return {
        ok: false,
        message: 'No autorizado para modificar esta categoría',
      };
    }

    // Verificar si ya existe otra categoría con el mismo nombre para esta empresa
    const duplicateCategory = await prisma.category.findUnique({
      where: {
        name_companyId: {
          name: data.name.trim(),
          companyId,
        },
      },
    });

    if (duplicateCategory && duplicateCategory.id !== data.id) {
      return {
        ok: false,
        message: 'Ya existe una categoría con ese nombre',
      };
    }

    const category = await prisma.category.update({
      where: { id: data.id },
      data: {
        name: data.name.trim(),
      },
    });

    revalidatePath('/gestion/product');
    revalidatePath('/gestion/products');

    return {
      ok: true,
      category,
    };
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    return {
      ok: false,
      message: 'Error al actualizar la categoría',
    };
  }
}
