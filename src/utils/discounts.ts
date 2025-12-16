import { DiscountType, DiscountTargetType, DiscountConditionType } from '@prisma/client';
import type { Product } from '@/interfaces';

export interface Discount {
  id: string;
  name: string;
  description?: string | null;
  type: DiscountType;
  value: any; // number para PERCENTAGE/FIXED_AMOUNT, {buy: number, pay: number} para BUY_X_GET_Y
  isActive: boolean;
  combinable: boolean;
  priority: number;
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

export interface AppliedDiscount {
  discount: Discount;
  discountAmount: number;
  finalPrice: number;
  badgeText: string;
}

/**
 * Verifica si un descuento aplica a un producto
 * @param checkConditions - Si es false, no verifica condiciones MIN_QUANTITY/MIN_AMOUNT (útil para mostrar badges)
 */
export function discountAppliesToProduct(
  discount: Discount,
  product: Product,
  quantity: number = 1,
  cartTotal: number = 0,
  checkConditions: boolean = true
): boolean {
  // Verificar si está activo
  if (!discount.isActive) return false;

  // Verificar fechas
  const now = new Date();
  if (discount.startsAt && new Date(discount.startsAt) > now) return false;
  if (discount.endsAt && new Date(discount.endsAt) < now) return false;

  // Verificar targets
  let matchesTarget = false;
  for (const target of discount.targets) {
    if (target.targetType === 'ALL') {
      matchesTarget = true;
      break;
    } else if (target.targetType === 'PRODUCT' && target.targetId === product.id) {
      matchesTarget = true;
      break;
    } else if (target.targetType === 'CATEGORY' && target.targetId === product.categoryId) {
      matchesTarget = true;
      break;
    } else if (target.targetType === 'TAG' && product.tags?.some(tag => tag.id === target.targetId)) {
      matchesTarget = true;
      break;
    }
  }

  if (!matchesTarget) return false;

  // Para BUY_X_GET_Y, verificar condiciones de manera especial
  if (discount.type === 'BUY_X_GET_Y') {
    // Si no estamos verificando condiciones, permitir mostrar el badge
    if (!checkConditions) {
      return true;
    }
    
    // Si estamos verificando condiciones, verificar MIN_QUANTITY pero también verificar
    // que la cantidad cumpla con el buyXGetY.buy
    const buyXGetY = typeof discount.value === 'object' && discount.value !== null
      ? discount.value as { buy: number; pay: number }
      : null;
    
    if (buyXGetY) {
      // Para BUY_X_GET_Y, la cantidad mínima es el valor de "buy"
      if (quantity < buyXGetY.buy) {
        return false;
      }
    }
    
    // Verificar otras condiciones (MIN_AMOUNT)
    for (const condition of discount.conditions) {
      if (condition.conditionType === 'MIN_AMOUNT' && cartTotal < condition.value) {
        return false;
      }
    }
    
    return true;
  }

  // Verificar condiciones solo si checkConditions es true (para otros tipos de descuento)
  if (checkConditions) {
    for (const condition of discount.conditions) {
      if (condition.conditionType === 'MIN_QUANTITY' && quantity < condition.value) {
        return false;
      }
      if (condition.conditionType === 'MIN_AMOUNT' && cartTotal < condition.value) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Calcula el descuento aplicado a un producto
 */
export function calculateDiscount(
  discount: Discount,
  productPrice: number,
  quantity: number = 1
): AppliedDiscount | null {
  let discountAmount = 0;
  let badgeText = '';
  let finalPrice = productPrice;

  if (discount.type === 'PERCENTAGE') {
    const percentage = typeof discount.value === 'number' ? discount.value : 0;
    discountAmount = (productPrice * percentage) / 100;
    badgeText = `${percentage}% OFF`;
    finalPrice = Math.max(0, productPrice - discountAmount);
  } else if (discount.type === 'FIXED_AMOUNT') {
    const fixedAmount = typeof discount.value === 'number' ? discount.value : 0;
    discountAmount = Math.min(fixedAmount, productPrice); // No puede ser mayor que el precio
    badgeText = `$${fixedAmount} OFF`;
    finalPrice = Math.max(0, productPrice - discountAmount);
  } else if (discount.type === 'BUY_X_GET_Y') {
    const buyXGetY = typeof discount.value === 'object' && discount.value !== null
      ? discount.value as { buy: number; pay: number }
      : null;
    
    if (!buyXGetY) {
      return null;
    }

    // Siempre generar el badge para BUY_X_GET_Y
    badgeText = `${buyXGetY.buy}x${buyXGetY.pay}`;
    
    // Solo calcular el descuento si se cumple la cantidad mínima
    if (quantity >= buyXGetY.buy) {
      // Calcular cuántos grupos completos de "buy" hay
      const groups = Math.floor(quantity / buyXGetY.buy);
      const itemsToPay = groups * buyXGetY.pay;
      const remainingItems = quantity - (groups * buyXGetY.buy);
      
      // Total a pagar: grupos completos (pagas solo "pay") + items restantes sin descuento
      const totalToPay = (itemsToPay + remainingItems) * productPrice;
      const totalWithoutDiscount = quantity * productPrice;
      
      // Descuento total aplicado
      discountAmount = totalWithoutDiscount - totalToPay;
      
      // Precio unitario efectivo después del descuento (total a pagar / cantidad total)
      finalPrice = totalToPay / quantity;
    } else {
      // Si no cumple la cantidad mínima, el descuento es 0 pero el badge se muestra
      discountAmount = 0;
      finalPrice = productPrice;
    }
  }

  return {
    discount,
    discountAmount,
    finalPrice,
    badgeText
  };
}

/**
 * Obtiene el mejor descuento aplicable a un producto
 * (el de mayor prioridad o mayor descuento)
 * @param checkConditions - Si es false, no verifica condiciones para mostrar badges (útil para BUY_X_GET_Y en catálogo)
 */
export function getBestDiscount(
  discounts: Discount[],
  product: Product,
  quantity: number = 1,
  cartTotal: number = 0,
  checkConditions: boolean = true
): AppliedDiscount | null {
  const applicableDiscounts = discounts
    .filter(d => discountAppliesToProduct(d, product, quantity, cartTotal, checkConditions))
    .map(d => calculateDiscount(d, product.price, quantity))
    .filter((d): d is AppliedDiscount => d !== null);

  if (applicableDiscounts.length === 0) return null;

  // Ordenar por prioridad (mayor primero) y luego por monto de descuento (mayor primero)
  applicableDiscounts.sort((a, b) => {
    if (b.discount.priority !== a.discount.priority) {
      return b.discount.priority - a.discount.priority;
    }
    return b.discountAmount - a.discountAmount;
  });

  return applicableDiscounts[0];
}

/**
 * Formatea el texto del badge de descuento
 */
export function formatDiscountBadge(discount: Discount): string {
  if (discount.type === 'PERCENTAGE') {
    const percentage = typeof discount.value === 'number' ? discount.value : 0;
    return `${percentage}% OFF`;
  } else if (discount.type === 'FIXED_AMOUNT') {
    const fixedAmount = typeof discount.value === 'number' ? discount.value : 0;
    return `$${fixedAmount} OFF`;
  } else if (discount.type === 'BUY_X_GET_Y') {
    const buyXGetY = typeof discount.value === 'object' && discount.value !== null
      ? discount.value as { buy: number; pay: number }
      : null;
    if (buyXGetY) {
      return `${buyXGetY.buy}x${buyXGetY.pay}`;
    }
  }
  return 'Promo';
}
