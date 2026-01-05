'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';
import { revalidatePath } from 'next/cache';
import { InputJsonValue } from '@prisma/client/runtime/client';

interface UpdateSectionData {
  sectionId: string;
  type?: 'HERO' | 'BANNER' | 'TEXT' | 'IMAGE' | 'FEATURES' | 'GALLERY' | 'CTA' | 'MAP' | 'SLIDER' | 'CAROUSEL';
  position?: number;
  content?: Record<string, unknown>;
  config?: Record<string, unknown> | null;
  enabled?: boolean;
}

export const updateSection = async (data: UpdateSectionData) => {
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

    // Verificar que la sección pertenece a una página de la compañía
    const section = await prisma.pageSection.findFirst({
      where: {
        id: data.sectionId,
        page: {
          companyId,
        },
      },
      include: {
        page: true,
      },
    });

    if (!section) {
      return {
        ok: false,
        message: 'Sección no encontrada'
      };
    }

    // Actualizar la sección
    const updateData: Record<string, unknown> = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.content !== undefined) updateData.content = data.content as InputJsonValue;
    if (data.config !== undefined) {
      updateData.config = data.config ? (data.config as InputJsonValue) : null;
    }
    if (data.enabled !== undefined) updateData.enabled = data.enabled;

    await prisma.pageSection.update({
      where: {
        id: data.sectionId,
      },
      data: updateData,
    });

    revalidatePath('/gestion/pages');
    revalidatePath('/');

    return {
      ok: true,
      message: 'Sección actualizada correctamente'
    };
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'No se pudo actualizar la sección'
    };
  }
};
