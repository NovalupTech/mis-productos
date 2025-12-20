'use server'

import prisma from "@/lib/prisma";
import { middleware } from "@/auth.config";

/**
 * Obtiene todos los favoritos del usuario actual
 */
export const getUserFavorites = async () => {
  try {
    const session = await middleware();
    
    if (!session?.user?.id) {
      return {
        ok: false,
        favorites: [],
        message: 'Debes iniciar sesión',
      };
    }

    const userId = session.user.id;

    const favorites = await prisma.userFavorite.findMany({
      where: {
        userId,
      },
      include: {
        product: {
          include: {
            productImage: {
              select: {
                url: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
                companyId: true,
              }
            },
            tags: {
              include: {
                tag: {
                  select: {
                    id: true,
                    name: true,
                  }
                }
              }
            },
            ProductAttribute: {
              include: {
                attribute: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                    required: true,
                    companyId: true,
                  }
                },
                attributeValue: {
                  select: {
                    id: true,
                    value: true,
                  }
                }
              }
            }
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      ok: true,
      favorites,
    };
  } catch (error) {
    console.error('Error al obtener favoritos:', error);
    return {
      ok: false,
      favorites: [],
      message: 'Error al obtener favoritos',
    };
  }
}
