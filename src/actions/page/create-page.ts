'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';
import { revalidatePath } from 'next/cache';

interface CreatePageData {
  type: 'HOME' | 'CATALOG' | 'INFO';
  slug: string;
  title: string;
  enabled?: boolean;
  isLanding?: boolean;
}

export const createPage = async (data: CreatePageData) => {
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

    // Validar que el slug no esté en uso
    const existingPageBySlug = await prisma.page.findFirst({
      where: {
        companyId,
        slug: data.slug,
      },
    });

    if (existingPageBySlug) {
      return {
        ok: false,
        message: 'Ya existe una página con ese slug'
      };
    }

    // Validar que no exista otra página del mismo tipo
    // El constraint único en la BD no permite múltiples páginas del mismo tipo
    const existingPageByType = await prisma.page.findFirst({
      where: {
        companyId,
        type: data.type,
      },
    });

    if (existingPageByType) {
      return {
        ok: false,
        message: `Ya existe una página de tipo ${data.type}. Solo puede haber una página de cada tipo por compañía.`
      };
    }

    // Validar que el slug no sea una ruta reservada
    const reservedRoutes = ['catalog', 'cart', 'checkout', 'orders', 'profile', 'product', 'products', 'auth', 'gestion', 'api', 'landing'];
    if (reservedRoutes.includes(data.slug.toLowerCase())) {
      return {
        ok: false,
        message: 'El slug no puede ser una ruta reservada del sistema'
      };
    }

    // Si se está marcando como landing, desmarcar las demás
    if (data.isLanding === true) {
      await prisma.page.updateMany({
        where: {
          companyId,
        },
        data: {
          isLanding: false,
        },
      });
    }

    // Si es CATALOG, forzar el slug a "catalog"
    const finalSlug = data.type === 'CATALOG' ? 'catalog' : data.slug.toLowerCase().trim();

    // Crear la página
    const newPage = await prisma.page.create({
      data: {
        companyId,
        type: data.type,
        slug: finalSlug,
        title: data.title,
        enabled: data.enabled ?? true,
        isLanding: data.isLanding ?? false,
      },
    });

    revalidatePath('/gestion/pages');
    revalidatePath('/');

    return {
      ok: true,
      message: 'Página creada correctamente',
      page: newPage,
    };
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'No se pudo crear la página'
    };
  }
};
