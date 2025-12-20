'use server'

import prisma from "@/lib/prisma";
import { middleware } from "@/auth.config";

/**
 * Verifica si un producto está en los favoritos del usuario
 */
export const checkFavorite = async (productId: string): Promise<boolean> => {
  try {
    const session = await middleware();
    
    if (!session?.user?.id) {
      return false;
    }

    const userId = session.user.id;

    const favorite = await prisma.userFavorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    return !!favorite;
  } catch (error) {
    console.error('Error al verificar favorito:', error);
    return false;
  }
}
