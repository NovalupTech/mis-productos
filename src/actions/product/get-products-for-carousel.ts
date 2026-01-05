'use server';

import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';
import { Product } from '@/interfaces';

interface GetProductsForCarouselParams {
  productIds?: string[];
  search?: string;
  categoryIds?: string[];
  tagIds?: string[];
  featured?: boolean;
  limit?: number;
}

export const getProductsForCarousel = async (params: GetProductsForCarouselParams = {}): Promise<Product[]> => {
  try {
    const companyId = await getCompanyIdFromContext();
    
    if (!companyId) {
      return [];
    }

    const {
      productIds,
      search,
      categoryIds,
      tagIds,
      featured,
      limit = 20,
    } = params;

    const where: any = {
      companyId,
      active: true,
    };

    // Si hay IDs específicos de productos, usar esos
    if (productIds && productIds.length > 0) {
      where.id = {
        in: productIds,
      };
    } else {
      // Construir condiciones de búsqueda
      const conditions: any[] = [];

      // Búsqueda por nombre o código
      if (search) {
        conditions.push({
          OR: [
            {
              title: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              code: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        });
      }

      // Filtro por categorías
      if (categoryIds && categoryIds.length > 0) {
        where.categoryId = {
          in: categoryIds,
        };
      }

      // Filtro por tags
      if (tagIds && tagIds.length > 0) {
        where.tags = {
          some: {
            tagId: {
              in: tagIds,
            },
          },
        };
      }

      // Filtro por featured
      if (featured !== undefined) {
        where.featured = featured;
      }

      // Combinar condiciones
      if (conditions.length > 0) {
        where.AND = conditions;
      }
    }

    const products = await prisma.product.findMany({
      where,
      take: limit,
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
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                createdAt: true,
              },
            },
          },
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
              },
            },
            attributeValue: {
              select: {
                id: true,
                value: true,
              },
            },
          },
        },
      },
      orderBy: [
        { featured: 'desc' },
        { title: 'asc' },
      ],
    });

    // Transformar a formato Product
    return products.map((product) => ({
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      inStock: product.inStock,
      slug: product.slug,
      featured: product.featured,
      code: product.code,
      companyId: product.companyId,
      categoryId: product.categoryId,
      images: product.productImage.map((img) => img.url),
      category: product.category ? {
        id: product.category.id,
        name: product.category.name,
        companyId: product.category.companyId,
      } : undefined,
      company: product.company ? {
        id: product.company.id,
        name: product.company.name,
      } : undefined,
      tags: product.tags
        .filter((pt) => pt.tag !== null)
        .map((pt) => ({
          id: pt.tag!.id,
          name: pt.tag!.name,
          createdAt: pt.tag!.createdAt,
        })),
      attributes: product.ProductAttribute.map((pa) => ({
        attribute: {
          id: pa.attribute.id,
          name: pa.attribute.name,
          type: pa.attribute.type,
          required: pa.attribute.required,
          companyId: pa.attribute.companyId,
        },
        attributeValue: pa.attributeValue ? {
          id: pa.attributeValue.id,
          value: pa.attributeValue.value,
        } : undefined,
      })),
    }));
  } catch (error) {
    console.error('Error al obtener productos para carousel:', error);
    return [];
  }
};
