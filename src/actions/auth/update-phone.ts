'use server'

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';

export const updateUserPhone = async (phone: string) => {
  const session = await middleware();

  if (!session?.user?.email) {
    return {
      ok: false,
      message: 'No se pudo obtener la sesión del usuario'
    };
  }

  try {
    await prisma.user.update({
      where: { email: session.user.email.toLowerCase() },
      data: { phone },
    });

    return {
      ok: true,
      message: 'Teléfono actualizado correctamente'
    };
  } catch (error) {
    console.error('Error al actualizar teléfono:', error);
    return {
      ok: false,
      message: 'No se pudo actualizar el teléfono'
    };
  }
};
