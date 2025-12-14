'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';
import { revalidatePath } from 'next/cache';

interface CreateSectionData {
  pageId: string;
  type: 'HERO' | 'BANNER' | 'TEXT' | 'IMAGE' | 'FEATURES' | 'GALLERY' | 'CTA';
  position: number;
  content: Record<string, unknown>;
  enabled?: boolean;
}

export const createSection = async (data: CreateSectionData) => {
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

    // Verificar que la página pertenece a la compañía
    const page = await prisma.page.findFirst({
      where: {
        id: data.pageId,
        companyId,
      },
    });

    if (!page) {
      return {
        ok: false,
        message: 'Página no encontrada'
      };
    }

    // Obtener el número máximo de posición actual
    const maxPosition = await prisma.pageSection.findFirst({
      where: { pageId: data.pageId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const newPosition = data.position || (maxPosition ? maxPosition.position + 1 : 1);

    // Crear la sección
    const newSection = await prisma.pageSection.create({
      data: {
        pageId: data.pageId,
        type: data.type,
        position: newPosition,
        content: data.content,
        enabled: data.enabled ?? true,
      },
    });

    revalidatePath('/gestion/pages');
    revalidatePath('/');

    return {
      ok: true,
      message: 'Sección creada correctamente',
      section: newSection,
    };
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'No se pudo crear la sección'
    };
  }
};
