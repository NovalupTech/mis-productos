'use server';

import prisma from '@/lib/prisma';

/**
 * Obtiene la configuración de PayPal para una empresa (solo clientId, sin secret)
 */
export async function getPaypalConfig(companyId: string) {
  try {
    if (!companyId) {
      return {
        ok: false,
        clientId: null,
      };
    }

    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: {
        companyId_type: {
          companyId,
          type: 'PAYPAL',
        },
      },
      select: {
        enabled: true,
        config: true,
      },
    });

    if (!paymentMethod || !paymentMethod.enabled || !paymentMethod.config) {
      return {
        ok: false,
        clientId: null,
      };
    }

    const config = paymentMethod.config as { clientId: string; clientSecret: string };
    
    return {
      ok: true,
      clientId: config.clientId || null,
    };
  } catch (error) {
    console.error('Error al obtener configuración de PayPal:', error);
    return {
      ok: false,
      clientId: null,
    };
  }
}
