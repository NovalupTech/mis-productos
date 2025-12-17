'use server';

import { middleware } from '@/auth.config';
import { getCompanyIdFromContext } from '@/lib/company-context';
import prisma from '@/lib/prisma';
import { PaymentMethodType } from '@prisma/client';
import { InputJsonValue, JsonValue } from '@prisma/client/runtime/client';
import { z } from 'zod';

const bankTransferConfigSchema = z.object({
  bankName: z.string().min(1, 'El nombre del banco es requerido'),
  accountHolder: z.string().min(1, 'El titular de la cuenta es requerido'),
  cbu: z.string().min(1, 'El CBU es requerido'),
  alias: z.string().optional(),
  dni: z.string().optional(),
  notes: z.string().optional(),
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
