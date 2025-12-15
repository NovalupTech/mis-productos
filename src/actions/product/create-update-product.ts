'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Product } from '@prisma/client';
import { z } from 'zod';
import {v2 as cloudinary} from 'cloudinary';
import { requireCompanyId } from '@/lib/company-context';
import { getCurrentDomain } from '@/lib/domain';
cloudinary.config( process.env.CLOUDINARY_URL ?? '' );



const productSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  title: z.string().min(3).max(255),
  slug: z.string().min(3).max(255),
  description: z.string(),
  price: z.coerce
    .number()
    .min(0)
    .transform( val => Number(val.toFixed(2)) ),
  inStock: z.coerce
    .number()
    .min(0)
    .transform( val => Number(val.toFixed(0)) ),
  categoryId: z.string().uuid(),
  tagIds: z.array(z.string().uuid()).optional().default([]),
});







export const createUpdateProduct = async( formData: FormData ) => {

  // Extraer tagIds del FormData (puede haber múltiples valores con la misma clave)
  const tagIds = formData.getAll('tagIds').filter((id): id is string => typeof id === 'string');
  
  // Extraer atributos del FormData
  const attributesJson = formData.get('attributes');
  let attributes: any[] = [];
  if (attributesJson && typeof attributesJson === 'string') {
    try {
      attributes = JSON.parse(attributesJson);
    } catch (error) {
      console.error('Error al parsear atributos:', error);
    }
  }
  
  const data = {
    ...Object.fromEntries( formData ),
    tagIds: tagIds.length > 0 ? tagIds : [],
  };
  
  const productParsed = productSchema.safeParse( data );

  if ( !productParsed.success) {
    console.log( productParsed.error );
    return { ok: false }
  }

  const product = productParsed.data;
  product.slug = product.slug.toLowerCase().replace(/ /g, '-' ).trim();


  const { id, ...rest } = product;

  try {
    const prismaTx = await prisma.$transaction( async (tx) => {
  
      let product: Product;
      const companyId = await requireCompanyId();
  
      if ( id ) {
        // Actualizar
        product = await prisma.product.update({
          where: { id },
          data: {
            companyId: companyId,
            title: rest.title,
            slug: rest.slug,
            description: rest.description,
            price: rest.price,
            inStock: rest.inStock,
            categoryId: rest.categoryId,
          }
        });
  
      } else {
        // Crear
        product = await prisma.product.create({
          data: {
            companyId: companyId,
            title: rest.title,
            slug: rest.slug,
            description: rest.description,
            price: rest.price,
            inStock: rest.inStock,
            categoryId: rest.categoryId,
          }
        })
      }

      // Gestionar tags del producto
      // Primero, eliminar todas las relaciones existentes
      await tx.productTag.deleteMany({
        where: { productId: product.id }
      });

      // Luego, crear las nuevas relaciones con los tags seleccionados
      if (rest.tagIds && rest.tagIds.length > 0) {
        await tx.productTag.createMany({
          data: rest.tagIds.map(tagId => ({
            productId: product.id,
            tagId: tagId,
          })),
          skipDuplicates: true, // Por si acaso hay duplicados
        });
      }

      // Gestionar atributos del producto
      // Primero, eliminar todos los atributos existentes
      await tx.productAttribute.deleteMany({
        where: { productId: product.id }
      });

      // Luego, crear los nuevos atributos
      if (attributes && attributes.length > 0) {
        // Obtener información de los atributos para saber su tipo
        const attributeIds = [...new Set(attributes.map(attr => attr.attributeId))];
        const attributesInfo = await tx.attribute.findMany({
          where: {
            id: { in: attributeIds },
            companyId: companyId,
          },
          select: {
            id: true,
            type: true,
          },
        });

        const attributeTypeMap = new Map(
          attributesInfo.map(attr => [attr.id, attr.type])
        );

        // Crear los ProductAttribute según el tipo
        const productAttributesToCreate: any[] = [];

        for (const attr of attributes) {
          const attributeType = attributeTypeMap.get(attr.attributeId);
          if (!attributeType) continue;

          if (attributeType === 'select' || attributeType === 'multiselect') {
            // Para select y multiselect, crear un ProductAttribute por cada attributeValueId
            if (attr.attributeValueIds && attr.attributeValueIds.length > 0) {
              for (const valueId of attr.attributeValueIds) {
                productAttributesToCreate.push({
                  productId: product.id,
                  attributeId: attr.attributeId,
                  attributeValueId: valueId,
                });
              }
            }
          } else if (attributeType === 'text') {
            // Para text, guardar en valueText
            if (attr.valueText !== undefined && attr.valueText !== null && attr.valueText !== '') {
              productAttributesToCreate.push({
                productId: product.id,
                attributeId: attr.attributeId,
                valueText: attr.valueText,
              });
            }
          } else if (attributeType === 'number') {
            // Para number, guardar en valueNumber
            if (attr.valueNumber !== undefined && attr.valueNumber !== null) {
              productAttributesToCreate.push({
                productId: product.id,
                attributeId: attr.attributeId,
                valueNumber: attr.valueNumber,
              });
            }
          }
        }

        if (productAttributesToCreate.length > 0) {
          await tx.productAttribute.createMany({
            data: productAttributesToCreate,
            skipDuplicates: true,
          });
        }
      }
  
      
      // Proceso de carga y guardado de imagenes
      // Recorrer las imagenes y guardarlas
      if ( formData.getAll('images') ) {
        // [https://url.jpg, https://url.jpg]
        const images = await uploadImages(formData.getAll('images') as File[]);
        if ( !images ) {
          throw new Error('No se pudo cargar las imágenes, rollingback');
        }

        await prisma.productImage.createMany({
          data: images.map( image => ({
            url: image!,
            productId: product.id,
          }))
        });

      }
  
  
  
      
      return {
        product,
        ok: true
      }
    });


    // Todo: RevalidatePaths
    revalidatePath('/gestion/products');
    revalidatePath(`/gestion/product/${ product.slug }`);
    revalidatePath(`/products/${ product.slug }`);


    return {
      ok: true,
      product: prismaTx.product,
    }

    
  } catch (error) {
    
    return {
      ok: false,
      message: 'Revisar los logs, no se pudo actualizar/crear'
    }
  }

}



const uploadImages = async( images: File[] ) => {

  try {

    const uploadPromises = images.map( async( image) => {

      try {
        const buffer = await image.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString('base64');
  
        const domain = await getCurrentDomain();
        return cloudinary.uploader.upload(`data:image/png;base64,${ base64Image }`, {
          folder: `misproductos/products/${domain}`
        })
          .then( r => r.secure_url );
        
      } catch (error) {
        console.log(error);
        return null;
      }
    })


    const uploadedImages = await Promise.all( uploadPromises );
    return uploadedImages;


  } catch (error) {

    console.log(error);
    return null;
    
  }


}