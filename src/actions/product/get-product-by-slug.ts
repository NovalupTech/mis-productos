'use server'

export const runtime = 'nodejs';

import prisma from "@/lib/prisma"
import { getCompanyIdFromContext } from "@/lib/company-context"

type Props = {
  slug: string
  companyId?: string
}

export const getProductBySlug = async ({ slug, companyId }: Props) => {
  try {
    // Si no se pasa companyId, obtenerlo del contexto (dominio)
    const finalCompanyId = companyId || await getCompanyIdFromContext();
    
    const product = await prisma.product.findFirst({
      where: {
        slug: slug.toLowerCase().replace(/ /g, '-' ).trim(),
        ...(finalCompanyId ? { companyId: finalCompanyId } : {}),
      },
      include: {
        productImage: {
          select: {
            id: true,
            url: true,
            productId: true
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
            email: true,
            phone: true,
            logo: true,
          }
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                createdAt: true,
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
      }
    })

    if(!product) return null;

    return {
      ...product,
      images: product.productImage.map((image) => image.url),
      tags: product.tags.map(pt => pt.tag),
      attributes: product.ProductAttribute.map(pa => ({
        id: pa.id,
        productId: pa.productId,
        attributeId: pa.attributeId,
        attributeValueId: pa.attributeValueId,
        valueText: pa.valueText,
        valueNumber: pa.valueNumber,
        attribute: pa.attribute,
        attributeValue: pa.attributeValue,
      }))
    }
  } catch (error) {
    console.error('Error getting product by slug:', error);
    throw new Error('Error getting product by slug')
  }
}
