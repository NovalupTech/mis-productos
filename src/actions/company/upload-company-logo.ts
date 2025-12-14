'use server';

import { middleware } from '@/auth.config';
import { getCurrentDomain } from '@/lib/domain';
import {v2 as cloudinary} from 'cloudinary';

cloudinary.config(process.env.CLOUDINARY_URL ?? '');

export const uploadCompanyLogo = async (logoFile: File) => {
  const session = await middleware();

  if (session?.user.role !== 'admin' && session?.user.role !== 'companyAdmin') {
    return {
      ok: false,
      message: 'Debe de ser un usuario administrador'
    };
  }

  try {

    // Convertir el archivo a base64
    const buffer = await logoFile.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');

    const domain = await getCurrentDomain();

    if (!domain) {
      return {
        ok: false,
        message: 'No se pudo determinar el dominio'
      };
    }

    // Subir a Cloudinary en la carpeta /logos/{companyId}
    const uploadResult = await cloudinary.uploader.upload(
      `data:image/png;base64,${base64Image}`,
      {
        folder: `misproductos/logos/${domain}`,
        transformation: [
          { width: 500, height: 500, crop: 'limit' },
          { quality: 'auto' },
        ],
      }
    );

    return {
      ok: true,
      url: uploadResult.secure_url,
    };
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'No se pudo subir el logo'
    };
  }
};
