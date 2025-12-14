'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';
import { revalidatePath } from 'next/cache';
import { SocialType } from '@prisma/client';

interface CreateCompanySocialData {
  type: SocialType;
  url: string;
  label?: string;
  enabled?: boolean;
  order?: number;
}

export const createCompanySocial = async (data: CreateCompanySocialData) => {
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

    // Verificar que no exista otra red social del mismo tipo
    const existingSocial = await prisma.companySocial.findFirst({
      where: {
        companyId,
        type: data.type,
      },
    });

    if (existingSocial) {
      return {
        ok: false,
        message: `Ya existe una red social de tipo ${data.type} para esta compañía`
      };
    }

    // Obtener el máximo order para asignar el siguiente
    const maxOrder = await prisma.companySocial.findFirst({
      where: { companyId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const newOrder = data.order ?? (maxOrder ? maxOrder.order + 1 : 0);

    const newSocial = await prisma.companySocial.create({
      data: {
        companyId,
        type: data.type,
        url: data.url,
        label: data.label,
        enabled: data.enabled ?? true,
        order: newOrder,
      },
    });

    revalidatePath('/gestion/company');
    revalidatePath('/');
    return {
      ok: true,
      message: 'Red social creada correctamente',
      social: newSocial,
    };
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'No se pudo crear la red social'
    };
  }
};
