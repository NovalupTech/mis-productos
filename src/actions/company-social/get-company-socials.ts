'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';

export const getCompanySocials = async () => {
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

    const socials = await prisma.companySocial.findMany({
      where: { companyId },
      orderBy: {
        order: 'asc',
      },
    });

    return {
      ok: true,
      socials,
    };
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'No se pudieron cargar las redes sociales'
    };
  }
};
