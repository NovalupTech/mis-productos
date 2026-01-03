'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';
import { revalidatePath } from 'next/cache';
import { SocialType } from '@prisma/client';

interface UpdateCompanySocialData {
  socialId: string;
  type?: SocialType;
  url?: string;
  label?: string;
  enabled?: boolean;
  order?: number;
}

export const updateCompanySocial = async (data: UpdateCompanySocialData) => {
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

    // Verificar que la red social pertenezca a la compañía
    const existingSocial = await prisma.companySocial.findFirst({
      where: {
        id: data.socialId,
        companyId,
      },
    });

    if (!existingSocial) {
      return {
        ok: false,
        message: 'Red social no encontrada'
      };
    }

    // Si se está cambiando el tipo, verificar que no exista otra del nuevo tipo
    if (data.type && data.type !== existingSocial.type) {
      const duplicateSocial = await prisma.companySocial.findFirst({
        where: {
          companyId,
          type: data.type,
          id: { not: data.socialId },
        },
      });

      if (duplicateSocial) {
        return {
          ok: false,
          message: `Ya existe una red social de tipo ${data.type} para esta compañía`
        };
      }
    }

    const updateData: Partial<UpdateCompanySocialData> = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.label !== undefined) updateData.label = data.label;
    if (data.enabled !== undefined) updateData.enabled = data.enabled;
    if (data.order !== undefined) updateData.order = data.order;

    const updatedSocial = await prisma.companySocial.update({
      where: { id: data.socialId },
      data: updateData,
    });

    revalidatePath('/gestion/company');
    revalidatePath('/');
    return {
      ok: true,
      message: 'Red social actualizada correctamente',
      social: updatedSocial,
    };
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'No se pudo actualizar la red social'
    };
  }
};
