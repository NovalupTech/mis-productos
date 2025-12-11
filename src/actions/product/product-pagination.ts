'use server'

export const runtime = 'nodejs';

import prisma from "@/lib/prisma";
import { getCompanyIdFromContext } from "@/lib/company-context";

interface PaginatedProducts {
  page?: number;
  take?: number;
  companyId?: string;
  categoryId?: string;
  search?: string;
}

export const getPaginatedProductsWithImages = async ({ 
  page = 1, 
  take = 40, 
  companyId,
  categoryId,
  search 
}: PaginatedProducts) => {

  if(isNaN(page) || page < 1) page = 1;
  if(isNaN(take) || take < 0) take = 12;

  try {
    // Si no se pasa companyId, obtenerlo del contexto (dominio)
    const finalCompanyId = companyId || await getCompanyIdFromContext();

    const where: any = {
      title: search ? {
        contains: search,
        mode: 'insensitive',
      } : undefined,
    };

    if (finalCompanyId) {
      where.companyId = finalCompanyId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const productsPromise = prisma.product.findMany({
      take,
      skip: (page - 1) * take,
      where,
      include: {
        productImage: {
          take: 2,
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
        company: {
          select: {
            id: true,
            name: true,
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
        }
      },
      orderBy: {
        title: 'asc'
      }
    });

    const totalProductsPromise = prisma.product.count({
      where,
    });

    const [products, totalProducts] = await Promise.all([productsPromise, totalProductsPromise]);

    const totalPages = Math.ceil(totalProducts / take);

    return {
      currentPage: page,
      totalPages,
      products: products.map((product) => ({
        ...product,
        images: product.productImage.map((image: { url: string }) => image.url),
        tags: product.tags.map((pt: { tag: { id: string; name: string } }) => pt.tag),
      }))
    }
  } catch (error) {
    console.log(error);
    throw new Error('No se pudieron cargar los productos, Asegurese de tener una conexión a internet o a la base de datos');
  }
};
