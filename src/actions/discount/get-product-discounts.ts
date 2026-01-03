'use server';

import prisma from '@/lib/prisma';
import { getCompanyIdFromContext } from '@/lib/company-context';
import type { Discount } from '@/utils/discounts';

export const getProductDiscounts = async (): Promise<Discount[]> => {
  try {
    const companyId = await getCompanyIdFromContext();
    
    if (!companyId) {
      return [];
    }

    const now = new Date();
    
    const discounts = await prisma.discount.findMany({
      where: {
        companyId,
        isActive: true,
        AND: [
          {
            OR: [
              { startsAt: null },
              { startsAt: { lte: now } }
            ]
          },
          {
            OR: [
              { endsAt: null },
              { endsAt: { gte: now } }
            ]
          }
        ]
      },
      include: {
        targets: true,
        conditions: true
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Transformar a formato esperado
    return discounts.map(d => ({
      id: d.id,
      name: d.name,
      description: d.description,
      type: d.type,
      value: d.value,
      isActive: d.isActive,
      combinable: d.combinable,
      priority: d.priority,
      startsAt: d.startsAt,
      endsAt: d.endsAt,
      targets: d.targets.map(t => ({
        targetType: t.targetType,
        targetId: t.targetId
      })),
      conditions: d.conditions.map(c => ({
        conditionType: c.conditionType,
        value: c.value
      }))
    }));
  } catch (error) {
    console.error('Error al obtener descuentos:', error);
    return [];
  }
};
