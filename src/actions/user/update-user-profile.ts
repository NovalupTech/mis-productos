'use server'

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { Address } from '@/interfaces/Address';

interface UpdateUserData {
  name: string;
  email: string;
  phone?: string | null;
}

export const updateUserProfile = async (userData: UpdateUserData) => {
  const session = await middleware();

  if (!session?.user?.id) {
    return {
      ok: false,
      message: 'No se pudo obtener la sesión del usuario'
    };
  }

  try {
    // Verificar si el email ya existe en otro usuario
    if (userData.email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email.toLowerCase() }
      });

      if (existingUser && existingUser.id !== session.user.id) {
        return {
          ok: false,
          message: 'El email ya está en uso por otro usuario'
        };
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: userData.name,
        email: userData.email.toLowerCase(),
        phone: userData.phone || null
      }
    });

    return {
      ok: true,
      message: 'Perfil actualizado correctamente'
    };
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    return {
      ok: false,
      message: 'No se pudo actualizar el perfil'
    };
  }
};

export const updateUserAddress = async (address: Address) => {
  const session = await middleware();

  if (!session?.user?.id) {
    return {
      ok: false,
      message: 'No se pudo obtener la sesión del usuario'
    };
  }

  try {
    const existingAddress = await prisma.userAddress.findFirst({
      where: { userId: session.user.id }
    });

    const addressData = {
      userId: session.user.id,
      firstName: address.firstName,
      lastName: address.lastName,
      address: address.address,
      address2: address.address2 || null,
      postalCode: address.postalCode,
      city: address.city,
      phone: address.phone,
      countryId: address.country
    };

    if (existingAddress) {
      await prisma.userAddress.update({
        where: { id: existingAddress.id },
        data: addressData
      });
    } else {
      await prisma.userAddress.create({
        data: addressData
      });
    }

    return {
      ok: true,
      message: 'Dirección actualizada correctamente'
    };
  } catch (error) {
    console.error('Error al actualizar dirección:', error);
    return {
      ok: false,
      message: 'No se pudo actualizar la dirección'
    };
  }
};
