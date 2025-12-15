'use server';

import { middleware } from '@/auth.config';
import { requireCompanyId } from '@/lib/company-context';
import { getCurrentDomain } from '@/lib/domain';
import prisma from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

cloudinary.config(process.env.CLOUDINARY_URL ?? '');

/**
 * Extrae el public_id de Cloudinary desde una URL
 * Las URLs de Cloudinary tienen el formato:
 * https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{folder}/{public_id}.{format}
 * o
 * https://res.cloudinary.com/{cloud_name}/image/upload/{folder}/{public_id}.{format}
 */
const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    if (!url.startsWith('http')) {
      return null;
    }

    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
    
    // Buscar 'upload' en el path
    const uploadIndex = pathParts.indexOf('upload');
    if (uploadIndex === -1 || uploadIndex === pathParts.length - 1) {
      return null;
    }
    
    // Todo después de 'upload' es el path completo
    // Puede ser: [version]/[folder]/[public_id] o [folder]/[public_id]
    const partsAfterUpload = pathParts.slice(uploadIndex + 1);
    
    if (partsAfterUpload.length === 0) {
      return null;
    }
    
    // El último elemento es el public_id con extensión
    const lastPart = partsAfterUpload[partsAfterUpload.length - 1];
    
    // Remover la extensión del archivo
    const publicId = lastPart.replace(/\.[^/.]+$/, '');
    
    // Si hay más partes, son el folder, reconstruir el public_id completo con folder
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

/**
 * Elimina un producto y todas sus imágenes asociadas
 */
export const deleteProduct = async (productId: string) => {
  const session = await middleware();

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'companyAdmin')) {
    return {
      ok: false,
      message: 'No tienes permisos para realizar esta acción',
    };
  }

  try {
    const companyId = await requireCompanyId();

    // Obtener el producto con todas sus imágenes
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        companyId: companyId,
      },
      include: {
        productImage: true,
      },
    });

    if (!product) {
      return {
        ok: false,
        message: 'Producto no encontrado',
      };
    }

    const domain = await getCurrentDomain();
    const folder = `misproductos/products/${domain}/`;

    // Eliminar imágenes de Cloudinary y de la base de datos
    const deleteImagePromises = product.productImage.map(async (image) => {
      const imageName = image.url
        .split('/')
        .pop()
        ?.split('.')[0] ?? '';
      // Eliminar de Cloudinary
      if (image.url.startsWith('http')) {
        try {
          await cloudinary.uploader.destroy(folder + imageName);
        } catch (error) {
          console.error(`Error al eliminar imagen de Cloudinary (${folder + imageName}):`, error);
          // Continuar aunque falle la eliminación en Cloudinary
        }
      }
      
      // Eliminar de la base de datos
      try {
        await prisma.productImage.delete({
          where: {
            id: image.id,
          },
        });
      } catch (error) {
        console.error(`Error al eliminar imagen de la BD (${image.id}):`, error);
        // Continuar aunque falle la eliminación en la BD
      }
    });

    await Promise.all(deleteImagePromises);

    // Eliminar ProductAttribute antes de eliminar el producto
    await prisma.productAttribute.deleteMany({
      where: {
        productId: productId,
      },
    });

    // Eliminar ProductTag antes de eliminar el producto
    await prisma.productTag.deleteMany({
      where: {
        productId: productId,
      },
    });

    // Eliminar el producto (ahora que las relaciones dependientes ya fueron eliminadas)
    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    // Revalidar paths
    revalidatePath('/gestion/products');
    revalidatePath('/catalog');
    revalidatePath(`/catalog/product/${product.slug}`);

    return {
      ok: true,
      message: 'Producto eliminado exitosamente',
    };
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return {
      ok: false,
      message: 'Error al eliminar el producto',
    };
  }
};
