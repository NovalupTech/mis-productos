'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const toggleOrderPayment = async (orderId: string, isPaid: boolean) => {
  const session = await middleware();

  if (session?.user.role !== 'admin' && session?.user.role !== 'companyAdmin') {
    return {
      ok: false,
      message: 'Debe de estar autenticado como admin'
    };
  }

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        isPaid,
        paidAt: isPaid ? new Date() : null,
      },
    });

    revalidatePath('/gestion/orders');
    revalidatePath(`/catalog/orders/${orderId}`);

    return {
      ok: true,
      message: `Orden ${isPaid ? 'marcada como pagada' : 'marcada como no pagada'}`
    };
  } catch (error) {
    console.error('Error al actualizar estado de pago:', error);
    return {
      ok: false,
      message: 'No se pudo actualizar el estado de pago'
    };
  }
};

