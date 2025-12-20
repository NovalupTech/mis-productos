'use server'

import prisma from "@/lib/prisma";
import { middleware } from "@/auth.config";

/**
 * Agrega o elimina un producto de los favoritos del usuario
 */
export const toggleFavorite = async (productId: string) => {
  try {
    const session = await middleware();
    
    if (!session?.user?.id) {
      return {
        ok: false,
        message: 'Debes iniciar sesión para agregar favoritos',
      };
    }

    const userId = session.user.id;

    // Verificar si el favorito ya existe
    const existingFavorite = await prisma.userFavorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingFavorite) {
      // Eliminar favorito
      await prisma.userFavorite.delete({
        where: {
          id: existingFavorite.id,
        },
      });
      return {
        ok: true,
        isFavorite: false,
        message: 'Producto eliminado de favoritos',
      };
    } else {
      // Agregar favorito
      await prisma.userFavorite.create({
        data: {
          userId,
          productId,
        },
      });
      return {
        ok: true,
        isFavorite: true,
        message: 'Producto agregado a favoritos',
      };
    }
  } catch (error) {
    console.error('Error al toggle favorito:', error);
    return {
      ok: false,
      message: 'Error al actualizar favoritos',
    };
  }
}
