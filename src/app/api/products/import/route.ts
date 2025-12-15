import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentDomain } from '@/lib/domain';
import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';
import { z } from 'zod';

cloudinary.config(process.env.CLOUDINARY_URL ?? '');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Schema para validar productos del API
const apiProductSchema = z.object({
  code: z.string().optional().nullable(),
  title: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().optional().default(''),
  price: z.number().min(0),
  inStock: z.number().min(0).default(0),
  category: z.string().optional().default(''),
  featured: z.boolean().optional().default(false),
  images: z.array(z.string()).optional().default([]), // URLs de imágenes
  tags: z.array(z.string()).optional().default([]),
  attributes: z.array(z.object({
    attributeName: z.string(),
    value: z.union([z.string(), z.number(), z.array(z.string())]),
  })).optional().default([]),
});

interface ImportRequest {
  products: z.infer<typeof apiProductSchema>[];
}

/**
 * Verifica y decodifica el token JWT
 */
function verifyToken(token: string): { companyId: string; userId: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    
    // Verificar firma
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
    
    if (signature !== expectedSignature) {
      return null;
    }

    // Decodificar payload
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());
    
    // Verificar expiración
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      companyId: payload.companyId,
      userId: payload.userId,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Endpoint para importar productos vía API
 * POST /api/products/import
 * Headers: { Authorization: Bearer <token> }
 * Body: { products: [...] }
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, message: 'Token de autenticación requerido' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const tokenData = verifyToken(token);

    if (!tokenData) {
      return NextResponse.json(
        { ok: false, message: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    const { companyId } = tokenData;

    // Parsear body
    const body: ImportRequest = await request.json();
    const { products } = body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { ok: false, message: 'Se requiere un array de productos' },
        { status: 400 }
      );
    }

    // Validar y procesar productos
    const domain = await getCurrentDomain();
    const folder = `misproductos/products/${domain}/`;
    const importedProducts: string[] = [];
    const errors: string[] = [];

    // Obtener categorías existentes
    const categories = await prisma.category.findMany({
      where: { companyId },
    });
    const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));

    // Función para obtener o crear categoría
    const getOrCreateCategory = async (categoryName: string): Promise<string> => {
      if (!categoryName || categoryName.trim() === '') {
        const defaultCategoryName = 'Sin categoría';
        const defaultKey = defaultCategoryName.toLowerCase();
        
        if (categoryMap.has(defaultKey)) {
          return categoryMap.get(defaultKey)!;
        }
        
        const defaultCategory = await prisma.category.upsert({
          where: {
            name_companyId: {
              name: defaultCategoryName,
              companyId: companyId,
            },
          },
          update: {},
          create: {
            name: defaultCategoryName,
            companyId: companyId,
          },
        });
        
        categoryMap.set(defaultKey, defaultCategory.id);
        return defaultCategory.id;
      }
      
      const categoryKey = categoryName.toLowerCase();
      
      if (categoryMap.has(categoryKey)) {
        return categoryMap.get(categoryKey)!;
      }
      
      const newCategory = await prisma.category.upsert({
        where: {
          name_companyId: {
            name: categoryName.trim(),
            companyId: companyId,
          },
        },
        update: {},
        create: {
          name: categoryName.trim(),
          companyId: companyId,
        },
      });
      
      categoryMap.set(categoryKey, newCategory.id);
      return newCategory.id;
    };

    // Procesar productos en transacción
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < products.length; i++) {
        const productData = products[i];
        
        try {
          // Validar producto
          const validated = apiProductSchema.parse(productData);
          
          // Generar slug si no se proporciona
          const slug = validated.slug || validated.title.toLowerCase().replace(/ /g, '-').trim();
          
          // Obtener o crear categoría
          const categoryId = await getOrCreateCategory(validated.category || '');
          
          // Generar código si no se proporciona
          let productCode = validated.code;
          if (!productCode || productCode.trim() === '') {
            const productsWithCode = await tx.product.findMany({
              where: {
                companyId: companyId,
                code: { startsWith: 'MP-' },
              },
              select: { code: true },
            });

            let maxNumber = 0;
            for (const product of productsWithCode) {
              if (product.code) {
                const match = product.code.match(/^MP-(\d+)$/);
                if (match) {
                  const number = parseInt(match[1], 10);
                  if (number > maxNumber) {
                    maxNumber = number;
                  }
                }
              }
            }

            const nextNumber = maxNumber + 1;
            productCode = `MP-${nextNumber.toString().padStart(6, '0')}`;
          } else {
            productCode = String(productCode).trim();
          }

          // Buscar producto existente por código
          const existingProduct = await tx.product.findFirst({
            where: {
              code: productCode,
              companyId: companyId,
            },
          });

          // Crear o actualizar producto
          const product = existingProduct
            ? await tx.product.update({
                where: { id: existingProduct.id },
                data: {
                  title: validated.title,
                  slug: slug,
                  description: validated.description || '',
                  price: validated.price,
                  inStock: validated.inStock,
                  featured: validated.featured || false,
                  categoryId: categoryId,
                },
              })
            : await tx.product.create({
                data: {
                  title: validated.title,
                  slug: slug,
                  description: validated.description || '',
                  price: validated.price,
                  inStock: validated.inStock,
                  code: productCode,
                  featured: validated.featured || false,
                  companyId: companyId,
                  categoryId: categoryId,
                },
              });

          // Eliminar imágenes existentes
          await tx.productImage.deleteMany({
            where: { productId: product.id },
          });

          // Procesar imágenes (subir a Cloudinary si son URLs externas o usar URLs directas)
          if (validated.images && validated.images.length > 0) {
            const imageUrls: string[] = [];
            
            for (const imageUrl of validated.images) {
              if (imageUrl.startsWith('http')) {
                // Si es una URL externa, subirla a Cloudinary
                try {
                  const result = await cloudinary.uploader.upload(imageUrl, {
                    folder: folder,
                  });
                  imageUrls.push(result.secure_url);
                } catch (error) {
                  console.error(`Error al subir imagen ${imageUrl}:`, error);
                  // Si falla, usar la URL original
                  imageUrls.push(imageUrl);
                }
              } else {
                // Si ya es una URL de Cloudinary, usarla directamente
                imageUrls.push(imageUrl);
              }
            }

            if (imageUrls.length > 0) {
              await tx.productImage.createMany({
                data: imageUrls.map(url => ({
                  url,
                  productId: product.id,
                })),
              });
            }
          }

          // Procesar tags
          if (validated.tags && validated.tags.length > 0) {
            // Eliminar tags existentes
            await tx.productTag.deleteMany({
              where: { productId: product.id },
            });

            // Crear o obtener tags
            const tagIds: string[] = [];
            for (const tagName of validated.tags) {
              const tag = await tx.tag.upsert({
                where: {
                  name_companyId: {
                    name: tagName.trim(),
                    companyId: companyId,
                  },
                },
                update: {},
                create: {
                  name: tagName.trim(),
                  companyId: companyId,
                },
              });
              tagIds.push(tag.id);
            }

            if (tagIds.length > 0) {
              await tx.productTag.createMany({
                data: tagIds.map(tagId => ({
                  productId: product.id,
                  tagId: tagId,
                })),
                skipDuplicates: true,
              });
            }
          }

          // Procesar atributos
          if (validated.attributes && validated.attributes.length > 0) {
            // Eliminar atributos existentes
            await tx.productAttribute.deleteMany({
              where: { productId: product.id },
            });

            // Obtener atributos existentes
            const existingAttributes = await tx.attribute.findMany({
              where: { companyId },
              include: { values: true },
            });
            const attributeMap = new Map(existingAttributes.map(a => [a.name.toLowerCase(), a]));

            for (const attrData of validated.attributes) {
              // Obtener o crear atributo
              let attribute = attributeMap.get(attrData.attributeName.toLowerCase());
              if (!attribute) {
                attribute = await tx.attribute.create({
                  data: {
                    name: attrData.attributeName,
                    type: 'text',
                    required: false,
                    companyId,
                  },
                  include: { values: true },
                });
                attributeMap.set(attrData.attributeName.toLowerCase(), attribute);
              }

              // Procesar valor según tipo
              if (attribute.type === 'select' || attribute.type === 'multiselect') {
                const values = Array.isArray(attrData.value) ? attrData.value : [attrData.value];
                
                for (const val of values) {
                  const valueStr = String(val).trim();
                  if (!valueStr) continue;

                  let attributeValue = attribute.values.find((v: { value: string }) => v.value.toLowerCase() === valueStr.toLowerCase());
                  
                  if (!attributeValue) {
                    attributeValue = await tx.attributeValue.create({
                      data: {
                        value: valueStr,
                        attributeId: attribute.id,
                      },
                    });
                    attribute.values.push(attributeValue);
                  }

                  await tx.productAttribute.create({
                    data: {
                      productId: product.id,
                      attributeId: attribute.id,
                      attributeValueId: attributeValue.id,
                    },
                  });
                }
              } else if (attribute.type === 'text') {
                await tx.productAttribute.create({
                  data: {
                    productId: product.id,
                    attributeId: attribute.id,
                    valueText: String(attrData.value),
                  },
                });
              } else if (attribute.type === 'number') {
                const numValue = typeof attrData.value === 'number' ? attrData.value : parseFloat(String(attrData.value));
                if (!isNaN(numValue)) {
                  await tx.productAttribute.create({
                    data: {
                      productId: product.id,
                      attributeId: attribute.id,
                      valueNumber: numValue,
                    },
                  });
                }
              }
            }
          }

          importedProducts.push(product.id);
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(`Producto ${i + 1}: ${error.errors.map(e => e.message).join(', ')}`);
          } else {
            errors.push(`Producto ${i + 1}: Error al procesar`);
          }
        }
      }
    });

    return NextResponse.json({
      ok: true,
      message: `Se importaron ${importedProducts.length} productos${errors.length > 0 ? `, ${errors.length} con errores` : ''}`,
      imported: importedProducts.length,
      errors: errors.length,
      errorDetails: errors,
    });
  } catch (error) {
    console.error('Error en importación API:', error);
    return NextResponse.json(
      { ok: false, message: 'Error al importar productos' },
      { status: 500 }
    );
  }
}
