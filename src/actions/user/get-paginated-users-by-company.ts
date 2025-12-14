'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';

interface PaginatedUsersByCompany {
  page?: number;
  take?: number;
  companyId?: string;
}

export const getPaginatedUsersByCompany = async ({ 
  page = 1, 
  take = 20,
  companyId
}: PaginatedUsersByCompany = {}) => {

  const session = await middleware();

  if (session?.user.role !== 'admin' && session?.user.role !== 'companyAdmin') {
    return {
      ok: false,
      message: 'Debe de ser un usuario administrador'
    };
  }

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(take) || take < 0) take = 20;

  try {
    // Si no se pasa companyId, obtenerlo del contexto (dominio)
    const finalCompanyId = companyId || await getCompanyIdFromContext();

    if (!finalCompanyId) {
      return {
        ok: false,
        message: 'No se pudo determinar la compañía'
      };
    }

    const where = {
      role: 'user' as const,
      companyId: finalCompanyId,
    };

    const usersPromise = prisma.user.findMany({
      take,
      skip: (page - 1) * take,
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        emailVerified: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    const totalUsersPromise = prisma.user.count({
      where,
    });

    const [users, totalUsers] = await Promise.all([usersPromise, totalUsersPromise]);

    const totalPages = Math.ceil(totalUsers / take);

    return {
      ok: true,
      users,
      currentPage: page,
      totalPages,
      totalUsers,
    };
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'No se pudieron cargar los usuarios'
    };
  }
};
