'use server';

import prisma from '@/lib/prisma';

/**
 * Obtiene los datos de la orden necesarios para PayPal (productos y dirección)
 * Sin requerir autenticación, solo con el orderId
 */
export async function getOrderDataForPayment(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        OrderAddress: {
          include: {
            country: true,
          },
        },
        OrderItem: {
          select: {
            price: true,
            quantity: true,
            product: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return {
        ok: false,
        message: 'Orden no encontrada',
        products: null,
        address: null,
        subTotal: null,
        tax: null,
        total: null,
      };
    }

    return {
      ok: true,
      products: order.OrderItem,
      address: order.OrderAddress,
      subTotal: order.subTotal,
      tax: order.tax,
      total: order.total,
    };
  } catch (error) {
    console.error('Error al obtener datos de la orden:', error);
    return {
      ok: false,
      message: 'Error al obtener datos de la orden',
      products: null,
      address: null,
      subTotal: null,
      tax: null,
      total: null,
    };
  }
}
