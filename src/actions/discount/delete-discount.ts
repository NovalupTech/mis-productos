'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';
import { revalidatePath } from 'next/cache';

export const deleteDiscount = async (discountId: string) => {
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

    // Verificar que el descuento existe
    const existingDiscount = await prisma.discount.findFirst({
      where: {
        id: discountId,
      },
    });

    if (!existingDiscount) {
      return {
        ok: false,
        message: 'Descuento no encontrado'
      };
    }

    // Eliminar el descuento (los targets y conditions se eliminarán automáticamente por cascade)
    await prisma.discount.delete({
      where: {
        id: discountId,
      },
    });

    revalidatePath('/gestion/descuentos');

    return {
      ok: true,
      message: 'Descuento eliminado correctamente',
    };
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'No se pudo eliminar el descuento'
    };
  }
};
