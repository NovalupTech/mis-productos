'use server'

import { cookies } from 'next/headers';
import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';

export async function setSelectedCompany(companyId: string) {
  const session = await middleware();
  
  // Solo permitir a usuarios con role "admin"
  if (!session?.user || session.user.role !== 'admin') {
    return {
      ok: false,
      message: 'No tienes permisos para realizar esta acción'
    };
  }

  // Verificar que la empresa existe
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true }
  });

  if (!company) {
    return {
      ok: false,
      message: 'Empresa no encontrada'
    };
  }

  // Establecer cookie con el companyId seleccionado
  const cookieStore = await cookies();
  cookieStore.set('admin-selected-company-id', companyId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 días
  });

  return {
    ok: true,
    message: 'Empresa seleccionada correctamente'
  };
}

