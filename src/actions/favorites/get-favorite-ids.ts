'use server'

import prisma from "@/lib/prisma";
import { middleware } from "@/auth.config";

/**
 * Obtiene solo los IDs de los productos favoritos del usuario actual
 * Más eficiente que getUserFavorites cuando solo necesitas verificar si un producto es favorito
 */
export const getFavoriteIds = async (): Promise<string[]> => {
  try {
    const session = await middleware();
    
    if (!session?.user?.id) {
      return [];
    }

    const userId = session.user.id;

    const favorites = await prisma.userFavorite.findMany({
      where: {
        userId,
      },
      select: {
        productId: true,
      },
    });

    return favorites.map(f => f.productId);
  } catch (error) {
    console.error('Error al obtener IDs de favoritos:', error);
    return [];
  }
}
