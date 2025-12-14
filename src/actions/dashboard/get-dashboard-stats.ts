'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';

export const getDashboardStats = async () => {
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

    // Obtener estadísticas en paralelo
    const [totalProducts, totalUsers, totalOrders, recentOrders, company] = await Promise.all([
      // Total de productos
      prisma.product.count({
        where: { companyId },
      }),
      // Total de usuarios (rol 'user')
      prisma.user.count({
        where: {
          companyId,
          role: 'user',
        },
      }),
      // Total de órdenes
      prisma.order.count({
        where: { companyId },
      }),
      // Últimas 5 órdenes
      prisma.order.findMany({
        where: { companyId },
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          total: true,
          createdAt: true,
          customer: {
            select: {
              name: true,
              email: true,
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      // Información de la compañía
      prisma.company.findUnique({
        where: { id: companyId },
        select: {
          name: true,
          email: true,
          phone: true,
          logo: true,
        },
      }),
    ]);

    return {
      ok: true,
      stats: {
        totalProducts,
        totalUsers,
        totalOrders,
        recentOrders,
        company,
      },
    };
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'No se pudieron cargar las estadísticas'
    };
  }
};
