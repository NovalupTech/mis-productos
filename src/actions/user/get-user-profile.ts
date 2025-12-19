'use server'

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';

export const getUserProfile = async () => {
  const session = await middleware();

  if (!session?.user?.id) {
    return {
      ok: false,
      message: 'No se pudo obtener la sesión del usuario'
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        UserAddress: {
          include: {
            country: true
          }
        }
      }
    });

    if (!user) {
      return {
        ok: false,
        message: 'Usuario no encontrado'
      };
    }

    return {
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
        address: user.UserAddress ? {
          ...user.UserAddress,
          country: user.UserAddress.countryId,
          address2: user.UserAddress.address2 ?? ''
        } : null
      }
    };
  } catch (error) {
    console.error('Error al obtener perfil del usuario:', error);
    return {
      ok: false,
      message: 'No se pudo obtener el perfil del usuario'
    };
  }
};
