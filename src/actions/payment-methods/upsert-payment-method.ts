'use server';

import { middleware } from '@/auth.config';
import { getCompanyIdFromContext } from '@/lib/company-context';
import prisma from '@/lib/prisma';
import { PaymentMethodType } from '@prisma/client';
import { InputJsonValue, JsonValue } from '@prisma/client/runtime/client';
import { z } from 'zod';
import { encrypt } from '@/lib/encryption';

const bankTransferConfigSchema = z.object({
  bankName: z.string().min(1, 'El nombre del banco es requerido'),
  accountHolder: z.string().min(1, 'El titular de la cuenta es requerido'),
  cbu: z.string().min(1, 'El CBU es requerido'),
  alias: z.string().optional(),
  dni: z.string().optional(),
  notes: z.string().optional(),
  receiptContactType: z.enum(['email', 'whatsapp'], {
    required_error: 'El tipo de contacto para recibir comprobante es requerido',
  }),
  receiptEmail: z.string().email('Email inválido').optional(),
  receiptWhatsApp: z.string().optional(),
}).refine((data) => {
  if (data.receiptContactType === 'email' && !data.receiptEmail) {
    return false;
  }
  if (data.receiptContactType === 'whatsapp' && !data.receiptWhatsApp) {
    return false;
  }
  return true;
}, {
  message: 'Debe proporcionar el email o número de WhatsApp según el tipo de contacto seleccionado para recibir comprobante',
});

const coordinateWithSellerConfigSchema = z.object({
  contactType: z.enum(['whatsapp', 'email'], {
    required_error: 'El tipo de contacto es requerido',
  }),
  whatsappNumber: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
}).refine((data) => {
  if (data.contactType === 'whatsapp' && !data.whatsappNumber) {
    return false;
  }
  if (data.contactType === 'email' && !data.email) {
    return false;
  }
  return true;
}, {
  message: 'Debe proporcionar el número de WhatsApp o el email según el tipo de contacto seleccionado',
});

const paypalConfigSchema = z.object({
  clientId: z.string().min(1, 'El Client ID de PayPal es requerido'),
  clientSecret: z.string().min(1, 'El Client Secret de PayPal es requerido'),
});

const mercadoPagoConfigSchema = z.object({
  clientId: z.string().min(1, 'El Client ID de Mercado Pago es requerido'),
  accessToken: z.string().min(1, 'El Access Token de Mercado Pago es requerido'),
});

export async function upsertPaymentMethod(
  type: PaymentMethodType,
  enabled: boolean,
  config?: Record<string, unknown>
) {
  try {
    const session = await middleware();

    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'companyAdmin')) {
      return {
        ok: false,
        message: 'No autorizado',
      };
    }

    const companyId = await getCompanyIdFromContext();
    if (!companyId) {
      return {
        ok: false,
        message: 'No se encontró la empresa del usuario',
      };
    }

    // Validar config según el tipo
    if (type === 'BANK_TRANSFER' && config) {
      const validation = bankTransferConfigSchema.safeParse(config);
      if (!validation.success) {
        return {
          ok: false,
          message: validation.error.errors[0].message,
        };
      }
    }

    if (type === 'COORDINATE_WITH_SELLER' && config) {
      const validation = coordinateWithSellerConfigSchema.safeParse(config);
      if (!validation.success) {
        return {
          ok: false,
          message: validation.error.errors[0].message,
        };
      }
    }

    if (type === 'PAYPAL' && config) {
      const validation = paypalConfigSchema.safeParse(config);
      if (!validation.success) {
        return {
          ok: false,
          message: validation.error.errors[0].message,
        };
      }

      // Encriptar el clientSecret antes de guardarlo
      const configToSave = {
        ...config,
        clientSecret: encrypt(config.clientSecret as string),
      };

      const paymentMethod = await prisma.paymentMethod.upsert({
        where: {
          companyId_type: {
            companyId,
            type,
          },
        },
        update: {
          enabled,
          config: configToSave as unknown as InputJsonValue,
        },
        create: {
          companyId,
          type,
          enabled,
          config: configToSave as unknown as InputJsonValue,
        },
      });

      return {
        ok: true,
        paymentMethod,
      };
    }

    if (type === 'MERCADOPAGO' && config) {
      const validation = mercadoPagoConfigSchema.safeParse(config);
      if (!validation.success) {
        return {
          ok: false,
          message: validation.error.errors[0].message,
        };
      }

      // Encriptar el accessToken antes de guardarlo
      // Eliminar clientSecret si existe (formato antiguo) para migrar al nuevo formato
      const configToSave: Record<string, unknown> = {
        clientId: config.clientId,
        accessToken: encrypt(config.accessToken as string),
      };
      
      // Eliminar explícitamente clientSecret si existe para evitar duplicados
      if ('clientSecret' in config) {
        delete configToSave.clientSecret;
      }

      const paymentMethod = await prisma.paymentMethod.upsert({
        where: {
          companyId_type: {
            companyId,
            type,
          },
        },
        update: {
          enabled,
          config: configToSave as unknown as InputJsonValue,
        },
        create: {
          companyId,
          type,
          enabled,
          config: configToSave as unknown as InputJsonValue,
        },
      });

      return {
        ok: true,
        paymentMethod,
      };
    }

    // Si está habilitado pero no tiene config requerida, retornar error
    if (enabled && type === 'BANK_TRANSFER' && !config) {
      return {
        ok: false,
        message: 'La transferencia bancaria requiere configuración',
      };
    }

    if (enabled && type === 'COORDINATE_WITH_SELLER' && !config) {
      return {
        ok: false,
        message: 'Coordinar con el vendedor requiere configuración',
      };
    }

    // Para PayPal, si está habilitando y no tiene config nueva, verificar si ya existe configuración guardada
    if (enabled && type === 'PAYPAL' && !config) {
      const existingPaypal = await prisma.paymentMethod.findUnique({
        where: {
          companyId_type: {
            companyId,
            type: 'PAYPAL',
          },
        },
        select: {
          config: true,
        },
      });

      // Si ya existe configuración guardada, permitir habilitar sin requerir config nueva
      if (existingPaypal?.config && 
          typeof existingPaypal.config === 'object' && 
          'clientId' in existingPaypal.config &&
          existingPaypal.config.clientId) {
        // Usar la configuración existente
        const paymentMethod = await prisma.paymentMethod.update({
          where: {
            companyId_type: {
              companyId,
              type: 'PAYPAL',
            },
          },
          data: {
            enabled,
          },
        });

        return {
          ok: true,
          paymentMethod,
        };
      }

      return {
        ok: false,
        message: 'PayPal requiere configuración',
      };
    }

    // Para Mercado Pago, si está habilitando y no tiene config nueva, verificar si ya existe configuración guardada
    if (enabled && type === 'MERCADOPAGO' && !config) {
      const existingMercadoPago = await prisma.paymentMethod.findUnique({
        where: {
          companyId_type: {
            companyId,
            type: 'MERCADOPAGO',
          },
        },
        select: {
          config: true,
        },
      });

      // Si ya existe configuración guardada, permitir habilitar sin requerir config nueva
      if (existingMercadoPago?.config && 
          typeof existingMercadoPago.config === 'object' && 
          'clientId' in existingMercadoPago.config &&
          existingMercadoPago.config.clientId) {
        // Usar la configuración existente
        const paymentMethod = await prisma.paymentMethod.update({
          where: {
            companyId_type: {
              companyId,
              type: 'MERCADOPAGO',
            },
          },
          data: {
            enabled,
          },
        });

        return {
          ok: true,
          paymentMethod,
        };
      }

      return {
        ok: false,
        message: 'Mercado Pago requiere configuración',
      };
    }

    const paymentMethod = await prisma.paymentMethod.upsert({
      where: {
        companyId_type: {
          companyId,
          type,
        },
      },
      update: {
        enabled,
        config: config as unknown as InputJsonValue | undefined,
      },
      create: {
        companyId,
        type,
        enabled,
        config: config as unknown as InputJsonValue | undefined,
      },
    });

    return {
      ok: true,
      paymentMethod,
    };
  } catch (error) {
    console.error('Error al guardar método de pago:', error);
    return {
      ok: false,
      message: 'Error al guardar método de pago',
    };
  }
}
