'use server';

import { middleware } from '@/auth.config';
import { requireCompanyId } from '@/lib/company-context';
import { getCurrentDomain } from '@/lib/domain';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';
import AdmZip from 'adm-zip';
import { v2 as cloudinary } from 'cloudinary';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

cloudinary.config(process.env.CLOUDINARY_URL ?? '');

/**
 * Extrae el public_id de Cloudinary desde una URL
 */
const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    if (!url.startsWith('http')) {
      return null;
    }

    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
    
    const uploadIndex = pathParts.indexOf('upload');
    if (uploadIndex === -1 || uploadIndex === pathParts.length - 1) {
      return null;
    }
    
    const partsAfterUpload = pathParts.slice(uploadIndex + 1);
    
    if (partsAfterUpload.length === 0) {
      return null;
    }
    
    const lastPart = partsAfterUpload[partsAfterUpload.length - 1];
    const publicId = lastPart.replace(/\.[^/.]+$/, '');
    
    if (partsAfterUpload.length > 1) {
      const folderParts = partsAfterUpload.slice(0, -1);
      return `${folderParts.join('/')}/${publicId}`;
    }
    
    return publicId || null;
  } catch (error) {
    console.error('Error al extraer public_id de URL:', error);
    return null;
  }
};

// Schema para validar productos del Excel
const productRowSchema = z.object({
  code: z.union([z.string(), z.coerce.string(), z.number()]).optional().transform(val => {
    // Convertir a string si es número
    if (typeof val === 'number') {
      return val.toString();
    }
    return val || undefined;
  }),
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().default(''),
  price: z.coerce.number().min(0),
  inStock: z.coerce.number().min(0),
  category: z.string().optional().default(''), // Puede venir vacía
  featured: z.coerce.boolean().optional().default(false),
  images: z.string().optional(), // Nombres de imágenes separados por coma
  tags: z.string().optional(), // Tags separados por coma
});

/**
 * Genera y descarga el Excel modelo
 */
export const downloadExcelTemplate = async () => {
  const session = await middleware();
  
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'companyAdmin')) {
    return {
      ok: false,
      message: 'No tienes permisos para realizar esta acción',
    };
  }

  try {
    // Crear workbook
    const workbook = XLSX.utils.book_new();
    
    // Crear hoja de productos
    const productsData = [
      {
        code: 12345, // Puede ser numérico o texto
        title: 'Producto Ejemplo',
        slug: 'producto-ejemplo',
        description: 'Descripción del producto',
        price: 100.00,
        inStock: 10,
        category: 'Nombre de la categoría', // Puede estar vacío, se creará automáticamente si no existe
        featured: false,
        images: '', // Opcional: si está vacío, buscará automáticamente code_1.jpg, code_2.jpg o nombre_producto_1.jpg
        tags: 'tag1,tag2',
      },
    ];
    
    const productsSheet = XLSX.utils.json_to_sheet(productsData);
    XLSX.utils.book_append_sheet(workbook, productsSheet, 'Productos');
    
    // Generar buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    return {
      ok: true,
      blob: new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    };
  } catch (error) {
    console.error('Error al generar template:', error);
    return {
      ok: false,
      message: 'Error al generar el template',
    };
  }
};

/**
 * Procesa el Excel de productos y retorna los datos parseados
 */
const processProductsExcel = async (file: File) => {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    return data;
  } catch (error) {
    console.error('Error al procesar Excel:', error);
    throw new Error('Error al procesar el archivo Excel');
  }
};

/**
 * Procesa el ZIP de imágenes y retorna un mapa de nombre -> URL
 */
const processImagesZip = async (file: File, companyId: string): Promise<Record<string, string>> => {
  try {
    const buffer = await file.arrayBuffer();
    const zip = new AdmZip(Buffer.from(buffer));
    const zipEntries = zip.getEntries();
    
    const domain = await getCurrentDomain();
    const imageMap: Record<string, string> = {};
    
    // Procesar cada imagen del ZIP
    for (const entry of zipEntries) {
      if (!entry.isDirectory && /\.(jpg|jpeg|png|gif|webp)$/i.test(entry.entryName)) {
        try {
          const imageBuffer = entry.getData();
          const base64Image = imageBuffer.toString('base64');
          
          // Subir a Cloudinary
          const uploadResult = await cloudinary.uploader.upload(
            `data:image/png;base64,${base64Image}`,
            {
              folder: `misproductos/products/${domain}`,
            }
          );
          
          // Usar el nombre del archivo (sin ruta) como clave
          const fileName = entry.entryName.split('/').pop() || entry.entryName;
          imageMap[fileName] = uploadResult.secure_url;
        } catch (error) {
          console.error(`Error al subir imagen ${entry.entryName}:`, error);
        }
      }
    }
    
    return imageMap;
  } catch (error) {
    console.error('Error al procesar ZIP:', error);
    throw new Error('Error al procesar el archivo ZIP de imágenes');
  }
};

/**
 * Procesa el Excel de atributos (opcional)
 */
const processAttributesExcel = async (file: File) => {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    return data;
  } catch (error) {
    console.error('Error al procesar Excel de atributos:', error);
    throw new Error('Error al procesar el archivo Excel de atributos');
  }
};

/**
 * Valida y genera preview de los productos a importar
 */
export const validateProductsImport = async (formData: FormData) => {
  const session = await middleware();
  
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'companyAdmin')) {
    return {
      ok: false,
      message: 'No tienes permisos para realizar esta acción',
    };
  }

  try {
    const companyId = await requireCompanyId();
    const productsFile = formData.get('products') as File;
    const imagesZip = formData.get('images') as File | null;
    const attributesFile = formData.get('attributes') as File | null;

    if (!productsFile) {
      return {
        ok: false,
        message: 'Debes subir el archivo Excel de productos',
      };
    }

    // Procesar Excel de productos
    const productsData = await processProductsExcel(productsFile);
    
    // Obtener categorías de la empresa
    const categories = await prisma.category.findMany({
      where: { companyId },
    });
    const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));

    // Función para obtener o crear categoría
    const getOrCreateCategory = async (categoryName: string): Promise<string> => {
      if (!categoryName || categoryName.trim() === '') {
        // Si no hay categoría, usar "Sin categoría" o crear una por defecto
        const defaultCategoryName = 'Sin categoría';
        const defaultKey = defaultCategoryName.toLowerCase();
        
        if (categoryMap.has(defaultKey)) {
          return categoryMap.get(defaultKey)!;
        }
        
        // Crear categoría por defecto
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
      
      // Crear nueva categoría
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

    // Validar productos
    const errors: string[] = [];
    const validProducts: any[] = [];

    for (let i = 0; i < productsData.length; i++) {
      const row = productsData[i];
      const rowNumber = i + 2; // +2 porque la fila 1 es el header

      try {
        const validated = productRowSchema.parse(row);
        
        // Obtener o crear categoría
        const categoryId = await getOrCreateCategory(validated.category || '');

        validProducts.push({
          ...validated,
          categoryId: categoryId,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push(`Fila ${rowNumber}: ${error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}`);
        } else {
          errors.push(`Fila ${rowNumber}: Error de validación`);
        }
      }
    }

    return {
      ok: true,
      preview: validProducts.slice(0, 50), // Mostrar máximo 50 en preview
      validation: {
        total: productsData.length,
        valid: validProducts.length,
        errors: errors,
      },
    };
  } catch (error) {
    console.error('Error al validar productos:', error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Error al validar los productos',
    };
  }
};

/**
 * Importa los productos masivamente
 */
export const importProducts = async (formData: FormData) => {
  const session = await middleware();
  
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'companyAdmin')) {
    return {
      ok: false,
      message: 'No tienes permisos para realizar esta acción',
    };
  }

  try {
    const companyId = await requireCompanyId();
    const productsFile = formData.get('products') as File;
    const imagesZip = formData.get('images') as File | null;
    const attributesFile = formData.get('attributes') as File | null;
    const deleteExisting = formData.get('deleteExisting') === 'true';

    if (!productsFile) {
      return {
        ok: false,
        message: 'Debes subir el archivo Excel de productos',
      };
    }

    // Procesar archivos
    const productsData = await processProductsExcel(productsFile);
    const imageMap: Record<string, string> = {};
    
    if (imagesZip) {
      const processedImages = await processImagesZip(imagesZip, companyId);
      Object.assign(imageMap, processedImages);
    }

    // Obtener datos necesarios
    const categories = await prisma.category.findMany({
      where: { companyId },
    });
    const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));
    
    // Función para obtener o crear categoría
    const getOrCreateCategory = async (tx: any, categoryName: string): Promise<string> => {
      if (!categoryName || categoryName.trim() === '') {
        // Si no hay categoría, usar "Sin categoría" o crear una por defecto
        const defaultCategoryName = 'Sin categoría';
        const defaultKey = defaultCategoryName.toLowerCase();
        
        if (categoryMap.has(defaultKey)) {
          return categoryMap.get(defaultKey)!;
        }
        
        // Crear categoría por defecto
        const defaultCategory = await tx.category.upsert({
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
      
      // Crear nueva categoría
      const newCategory = await tx.category.upsert({
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

    // Obtener tags existentes o crear nuevos
    const allTags = new Set<string>();
    productsData.forEach((p: any) => {
      if (p.tags) {
        const tags = String(p.tags).split(',').map(t => t.trim()).filter(t => t);
        tags.forEach(tag => allTags.add(tag));
      }
    });

    const tagMap = new Map<string, string>();
    for (const tagName of allTags) {
      const tag = await prisma.tag.upsert({
        where: {
          name_companyId: {
            name: tagName,
            companyId: companyId,
          },
        },
        update: {},
        create: {
          name: tagName,
          companyId: companyId,
        },
      });
      tagMap.set(tagName, tag.id);
    }

    // Función para generar código automáticamente
    const generateProductCode = async (tx: any, companyId: string): Promise<string> => {
      const productsWithCode = await tx.product.findMany({
        where: {
          companyId: companyId,
          code: {
            startsWith: 'MP-',
          },
        },
        select: {
          code: true,
        },
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
      return `MP-${nextNumber.toString().padStart(6, '0')}`;
    };

    // Importar productos en transacción
    // Capturar deleteExisting en una constante para evitar problemas de scope
    const shouldDeleteExisting = deleteExisting;
    const result = await prisma.$transaction(async (tx) => {
      // Si deleteExisting es true, eliminar todos los productos de la compañía
      if (shouldDeleteExisting) {
        const existingProducts = await tx.product.findMany({
          where: { companyId },
          include: { productImage: true },
        });

        const domain = await getCurrentDomain();
        const folder = `misproductos/products/${domain}/`;

        // Eliminar imágenes de Cloudinary y de la BD
        for (const product of existingProducts) {
          for (const image of product.productImage) {
            // Eliminar de Cloudinary
            if (image.url.startsWith('http')) {
              const imageName = image.url
                .split('/')
                .pop()
                ?.split('.')[0] ?? '';
              
              if (imageName) {
                try {
                  await cloudinary.uploader.destroy(folder + imageName);
                } catch (error) {
                  console.error(`Error al eliminar imagen de Cloudinary (${folder + imageName}):`, error);
                  // Continuar aunque falle la eliminación en Cloudinary
                }
              }
            }
            
            // Eliminar de la BD
            try {
              await tx.productImage.delete({
                where: { id: image.id },
              });
            } catch (error) {
              console.error(`Error al eliminar imagen de la BD:`, error);
            }
          }
        }

        // Eliminar relaciones dependientes antes de eliminar los productos
        // 1. Eliminar ProductAttribute
        await tx.productAttribute.deleteMany({
          where: {
            product: {
              companyId: companyId,
            },
          },
        });

        // 2. Eliminar ProductTag
        await tx.productTag.deleteMany({
          where: {
            product: {
              companyId: companyId,
            },
          },
        });

        // 3. Eliminar todos los productos (ahora que las relaciones ya fueron eliminadas)
        await tx.product.deleteMany({
          where: { companyId },
        });
      }

      let codeCounter = 1;
      const importedProducts: any[] = [];
      const updatedProducts: any[] = [];
      const errors: string[] = [];

      for (let i = 0; i < productsData.length; i++) {
        const row = productsData[i];
        const rowNumber = i + 2;

        try {
          const validated = productRowSchema.parse(row);
          
          // Obtener o crear categoría
          const categoryId = await getOrCreateCategory(tx, validated.category || '');

          // Generar código si no se proporciona
          let productCode = validated.code;
          if (!productCode || productCode.trim() === '') {
            productCode = await generateProductCode(tx, companyId);
          } else {
            // Asegurar que el código sea string
            productCode = String(productCode).trim();
          }

          // Buscar producto existente por código (si no estamos eliminando todos)
          let existingProduct = null;
          if (!shouldDeleteExisting && productCode) {
            existingProduct = await tx.product.findFirst({
              where: {
                companyId: companyId,
                code: productCode,
              },
              include: {
                productImage: true,
              },
            });
          }

          let product;
          if (existingProduct) {
            // Actualizar producto existente
            product = await tx.product.update({
              where: { id: existingProduct.id },
              data: {
                title: validated.title,
                slug: validated.slug.toLowerCase().replace(/ /g, '-').trim(),
                description: validated.description || '',
                price: validated.price,
                inStock: validated.inStock,
                featured: validated.featured || false,
                categoryId: categoryId,
              },
            });

            // Eliminar imágenes existentes del producto
            const domainForUpdate = await getCurrentDomain();
            const folderForUpdate = `misproductos/products/${domainForUpdate}/`;
            
            for (const image of existingProduct.productImage) {
              // Eliminar de Cloudinary
              if (image.url.startsWith('http')) {
                const imageName = image.url
                  .split('/')
                  .pop()
                  ?.split('.')[0] ?? '';
                
                if (imageName) {
                  try {
                    await cloudinary.uploader.destroy(folderForUpdate + imageName);
                  } catch (error) {
                    console.error(`Error al eliminar imagen de Cloudinary (${folderForUpdate + imageName}):`, error);
                  }
                }
              }
              
              // Eliminar de la BD
              await tx.productImage.delete({
                where: { id: image.id },
              });
            }

            // Eliminar tags existentes del producto
            await tx.productTag.deleteMany({
              where: { productId: product.id },
            });

            updatedProducts.push(product);
          } else {
            // Crear nuevo producto
            product = await tx.product.create({
              data: {
                title: validated.title,
                slug: validated.slug.toLowerCase().replace(/ /g, '-').trim(),
                description: validated.description || '',
                price: validated.price,
                inStock: validated.inStock,
                code: productCode,
                featured: validated.featured || false,
                companyId: companyId,
                categoryId: categoryId,
              },
            });

            importedProducts.push(product);
          }

          // Procesar imágenes
          // Función para sanitizar nombre de archivo (sin espacios, caracteres especiales)
          const sanitizeFileName = (name: string): string => {
            return name
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '_')
              .replace(/_+/g, '_')
              .replace(/^_|_$/g, '');
          };

          // Buscar imágenes por código o por nombre del producto
          const imageUrls: string[] = [];
          
          if (validated.images) {
            // Si se especifican imágenes explícitamente en el Excel
            const imageNames = String(validated.images).split(',').map(n => n.trim());
            for (const imageName of imageNames) {
              if (imageMap[imageName]) {
                imageUrls.push(imageMap[imageName]);
              }
            }
          } else {
            // Buscar imágenes automáticamente por código o nombre
            const sanitizedTitle = sanitizeFileName(validated.title);
            const productCodeStr = productCode || '';
            
            // Buscar imágenes con patrón: code_1.jpg, code_2.jpg, etc.
            if (productCodeStr) {
              let imageIndex = 1;
              while (true) {
                const imageName = `${productCodeStr}_${imageIndex}.jpg`;
                const imageNamePng = `${productCodeStr}_${imageIndex}.png`;
                const imageNameJpeg = `${productCodeStr}_${imageIndex}.jpeg`;
                
                if (imageMap[imageName]) {
                  imageUrls.push(imageMap[imageName]);
                } else if (imageMap[imageNamePng]) {
                  imageUrls.push(imageMap[imageNamePng]);
                } else if (imageMap[imageNameJpeg]) {
                  imageUrls.push(imageMap[imageNameJpeg]);
                } else {
                  break; // No hay más imágenes
                }
                imageIndex++;
              }
            }
            
            // Si no se encontraron imágenes por código, buscar por nombre del producto
            if (imageUrls.length === 0 && sanitizedTitle) {
              let imageIndex = 1;
              while (true) {
                const imageName = `${sanitizedTitle}_${imageIndex}.jpg`;
                const imageNamePng = `${sanitizedTitle}_${imageIndex}.png`;
                const imageNameJpeg = `${sanitizedTitle}_${imageIndex}.jpeg`;
                
                if (imageMap[imageName]) {
                  imageUrls.push(imageMap[imageName]);
                } else if (imageMap[imageNamePng]) {
                  imageUrls.push(imageMap[imageNamePng]);
                } else if (imageMap[imageNameJpeg]) {
                  imageUrls.push(imageMap[imageNameJpeg]);
                } else {
                  break; // No hay más imágenes
                }
                imageIndex++;
              }
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

          // Procesar tags
          if (validated.tags) {
            const tagNames = String(validated.tags).split(',').map(t => t.trim()).filter(t => t);
            const tagIds = tagNames.map(name => tagMap.get(name)).filter(Boolean) as string[];
            
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

        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(`Fila ${rowNumber}: ${error.errors.map(e => e.message).join(', ')}`);
          } else {
            errors.push(`Fila ${rowNumber}: Error al importar producto`);
          }
        }
      }

      return {
        imported: importedProducts.length,
        updated: updatedProducts.length,
        errors,
      };
    });

    revalidatePath('/gestion/products');
    revalidatePath('/catalog');

    const messageParts = [];
    if (result.imported > 0) {
      messageParts.push(`${result.imported} productos importados`);
    }
    if (result.updated > 0) {
      messageParts.push(`${result.updated} productos actualizados`);
    }
    if (result.errors.length > 0) {
      messageParts.push(`${result.errors.length} productos con errores`);
    }

    return {
      ok: true,
      message: messageParts.length > 0 
        ? messageParts.join(', ') + '.'
        : 'No se procesaron productos.',
      imported: result.imported,
      updated: result.updated,
      errors: result.errors,
    };
  } catch (error) {
    console.error('Error al importar productos:', error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Error al importar los productos',
    };
  }
};
