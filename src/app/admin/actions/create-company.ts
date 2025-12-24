'use server'

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const createCompanySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
});

export async function createCompany(formData: FormData) {
  const session = await middleware();
  
  // Solo permitir a usuarios con role "admin"
  if (!session?.user || session.user.role !== 'admin') {
    return {
      ok: false,
      message: 'No tienes permisos para realizar esta acción'
    };
  }

  try {
    const rawData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string || '',
      phone: formData.get('phone') as string || '',
      address: formData.get('address') as string || '',
    };

    // Validar datos
    const validatedData = createCompanySchema.parse({
      ...rawData,
      email: rawData.email || undefined,
      phone: rawData.phone || undefined,
      address: rawData.address || undefined,
    });

    // Crear la compañía
    const company = await prisma.company.create({
      data: {
        name: validatedData.name,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        logo: true,
        createdAt: true,
      },
    });

    return {
      ok: true,
      message: 'Compañía creada correctamente',
      company,
    };
  } catch (error) {
    console.error('Error al crear compañía:', error);
    
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        message: error.errors[0]?.message || 'Error de validación',
      };
    }

    return {
      ok: false,
      message: 'Error al crear la compañía. Intenta nuevamente.',
    };
  }
}



