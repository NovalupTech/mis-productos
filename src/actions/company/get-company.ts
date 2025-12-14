'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';

export const getCompany = async () => {
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

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        logo: true,
      },
    });

    if (!company) {
      return {
        ok: false,
        message: 'Compañía no encontrada'
      };
    }

    return {
      ok: true,
      company,
    };
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'No se pudo cargar la información de la compañía'
    };
  }
};
