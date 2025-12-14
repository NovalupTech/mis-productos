'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';


export const changeUserRole = async( userId: string, role: string ) => {

  const session = await middleware();

  if ( session?.user.role !== 'admin' && session?.user.role !== 'companyAdmin'  ) {
    return {
      ok: false,
      message: 'Debe de estar autenticado como admin'
    }
  }

  try {

    const validRoles: ('admin' | 'user' | 'companyAdmin')[] = ['admin', 'user', 'companyAdmin'];
    const newRole = validRoles.includes(role as any) ? role as 'admin' | 'user' | 'companyAdmin' : 'user';


    const user = await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        role: newRole
      }
    })

    revalidatePath('/admin/users');

    return {
      ok: true
    }
    
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'No se pudo actualizar el role, revisar logs'
    }
  }



}