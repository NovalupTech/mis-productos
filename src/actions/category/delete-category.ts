'use server';

import { middleware } from '@/auth.config';
import { getCompanyIdFromContext } from '@/lib/company-context';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function deleteCategory(categoryId: string) {
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
      where: { id: categoryId },
      include: {
        product: {
          take: 1,
        },
      },
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
        message: 'No autorizado para eliminar esta categoría',
      };
    }

    // Verificar si hay productos asociados a esta categoría
    if (existingCategory.product.length > 0) {
      return {
        ok: false,
        message: 'No se puede eliminar la categoría porque tiene productos asociados',
      };
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    revalidatePath('/gestion/product');
    revalidatePath('/gestion/products');

    return {
      ok: true,
      message: 'Categoría eliminada correctamente',
    };
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    return {
      ok: false,
      message: 'Error al eliminar la categoría',
    };
  }
}
