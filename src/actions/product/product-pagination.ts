'use server'

import prisma from "@/lib/prisma";
import { getCompanyIdFromContext } from "@/lib/company-context";

interface PaginatedProducts {
  page?: number;
  take?: number;
  companyId?: string;
  categoryId?: string;
  search?: string;
  tag?: string; // Nombre del tag para filtrar
  attributeFilters?: Record<string, string>; // attributeId -> attributeValueId
}

export const getPaginatedProductsWithImages = async ({ 
  page = 1, 
  take = 20, 
  companyId,
  categoryId,
  search,
  tag,
  attributeFilters = {}
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

    // Aplicar filtro por tag
    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: tag,
          },
        },
      };
    }

    // Aplicar filtros de atributos
    // Para múltiples filtros, necesitamos que el producto tenga TODOS los atributos filtrados
    if (Object.keys(attributeFilters).length > 0) {
      const attributeFilterConditions = Object.entries(attributeFilters).map(([attributeId, attributeValueId]) => ({
        ProductAttribute: {
          some: {
            attributeId,
            attributeValueId,
          },
        },
      }));
      
      // Si hay múltiples filtros, combinarlos con AND
      if (attributeFilterConditions.length === 1) {
        Object.assign(where, attributeFilterConditions[0]);
      } else {
        where.AND = [
          ...(where.AND || []),
          ...attributeFilterConditions,
        ];
      }
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
      orderBy: [
        { featured: 'desc' },
        { title: 'asc' }
      ]
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
        attributes: product.ProductAttribute.map((pa: any) => ({
          id: pa.id,
          productId: pa.productId,
          attributeId: pa.attributeId,
          attributeValueId: pa.attributeValueId,
          valueText: pa.valueText,
          valueNumber: pa.valueNumber,
          attribute: pa.attribute,
          attributeValue: pa.attributeValue,
        })),
      }))
    }
  } catch (error) {
    console.log(error);
    throw new Error('No se pudieron cargar los productos, Asegurese de tener una conexión a internet o a la base de datos');
  }
};
