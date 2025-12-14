'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';
import { revalidatePath } from 'next/cache';

interface UpdateCompanyData {
  name?: string;
  email?: string;
  phone?: string;
  logo?: string;
}

export const updateCompany = async (data: UpdateCompanyData) => {
  const session = await middleware();

  if (session?.user.role !== 'admin' && session?.user.role !== 'companyAdmin') {
    return {
      ok: false,
      message: 'Debe de ser un usuario administrador'
    };
  }

  try {
    const companyId = await getCompanyIdFromContext();

    if (!companyId) {
      return {
        ok: false,
        message: 'No se pudo determinar la compañía'
      };
    }

    const updateData: Partial<UpdateCompanyData> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.logo !== undefined) updateData.logo = data.logo;

    await prisma.company.update({
      where: { id: companyId },
      data: updateData,
    });

    revalidatePath('/gestion/company');
    revalidatePath('/');
    return {
      ok: true,
      message: 'Información de la compañía actualizada correctamente'
    };
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'No se pudo actualizar la información de la compañía'
    };
  }
};
