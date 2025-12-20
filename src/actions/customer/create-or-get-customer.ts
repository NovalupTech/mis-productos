'use server'

import prisma from "@/lib/prisma";

interface CreateCustomerData {
  name: string;
  email: string;
  phone?: string;
  companyId: string;
}

/**
 * Crea un Customer o lo obtiene si ya existe (basado en email y companyId)
 */
export const createOrGetCustomer = async (data: CreateCustomerData) => {
  try {
    // Buscar si ya existe un Customer con ese email y companyId
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        email: data.email.toLowerCase(),
        companyId: data.companyId
      }
    });

    if (existingCustomer) {
      // Actualizar datos si es necesario
      const updatedCustomer = await prisma.customer.update({
        where: { id: existingCustomer.id },
        data: {
          name: data.name,
          phone: data.phone || existingCustomer.phone
        }
      });
      return {
        ok: true,
        customer: updatedCustomer
      };
    }

    // Verificar si el email ya existe en otra company
    // Si existe, crear uno nuevo con un email modificado o manejar el error
    const emailExists = await prisma.customer.findUnique({
      where: {
        email: data.email.toLowerCase()
      }
    });

    if (emailExists) {
      // Si el email existe en otra company, crear uno nuevo con email modificado
      // O simplemente crear uno nuevo (depende de la lógica de negocio)
      // Por ahora, creamos uno nuevo con el mismo email si el schema lo permite
      // Nota: Esto podría fallar si email es único globalmente
      // En ese caso, necesitaríamos modificar el schema para hacer email único por companyId
    }

    // Crear nuevo Customer
    const newCustomer = await prisma.customer.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone || null,
        companyId: data.companyId
      }
    });

    return {
      ok: true,
      customer: newCustomer
    };
  } catch (error: any) {
    console.error('Error al crear/obtener Customer:', error);
    
    // Si el error es por email duplicado, intentar obtener el existente
    if (error?.code === 'P2002' && error?.meta?.target?.includes('email')) {
      // El email ya existe, buscar el customer existente para esta company
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          email: data.email.toLowerCase(),
          companyId: data.companyId
        }
      });
      
      if (existingCustomer) {
        return {
          ok: true,
          customer: existingCustomer
        };
      }
    }
    
    return {
      ok: false,
      message: 'Error al crear/obtener cliente',
      customer: null
    };
  }
}
