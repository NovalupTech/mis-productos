'use server';

import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';
import { revalidatePath } from 'next/cache';
import { DiscountType, DiscountTargetType, DiscountConditionType } from '@prisma/client';

interface UpdateDiscountData {
  discountId: string;
  name: string;
  description?: string;
  type: DiscountType;
  value: number | { buy: number; pay: number } | null;
  isActive?: boolean;
  combinable?: boolean;
  priority?: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
  targets: Array<{
    targetType: DiscountTargetType;
    targetId?: string | null;
  }>;
  conditions: Array<{
    conditionType: DiscountConditionType;
    value: number;
  }>;
}

export const updateDiscount = async (data: UpdateDiscountData) => {
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

    // Verificar que el descuento existe y pertenece a la compañía
    const existingDiscount = await prisma.discount.findFirst({
      where: {
        id: data.discountId,
        companyId,
      },
    });

    if (!existingDiscount) {
      return {
        ok: false,
        message: 'Descuento no encontrado'
      };
    }

    // Preparar el valor según el tipo
    let valueToStore: any = null;
    if (data.value !== null && data.value !== undefined) {
      if (data.type === 'BUY_X_GET_Y' && typeof data.value === 'object') {
        valueToStore = data.value;
      } else if (typeof data.value === 'number') {
        valueToStore = data.value;
      }
    }

    // Actualizar el descuento y sus relaciones
    const updatedDiscount = await prisma.discount.update({
      where: {
        id: data.discountId,
      },
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        type: data.type,
        value: valueToStore,
        isActive: data.isActive ?? true,
        combinable: data.combinable ?? false,
        priority: data.priority ?? 0,
        startsAt: data.startsAt || null,
        endsAt: data.endsAt || null,
        // Eliminar targets y conditions existentes y crear nuevos
        targets: {
          deleteMany: {},
          create: data.targets.map(target => ({
            targetType: target.targetType,
            targetId: target.targetId || null,
          }))
        },
        conditions: {
          deleteMany: {},
          create: data.conditions.map(condition => ({
            conditionType: condition.conditionType,
            value: condition.value,
          }))
        }
      },
      include: {
        targets: true,
        conditions: true
      }
    });

    revalidatePath('/gestion/descuentos');

    return {
      ok: true,
      message: 'Descuento actualizado correctamente',
      discount: updatedDiscount,
    };
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'No se pudo actualizar el descuento'
    };
  }
};
