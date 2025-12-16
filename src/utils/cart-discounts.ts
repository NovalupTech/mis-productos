import type { ProductInCart } from '@/interfaces';
import type { Discount } from '@/utils/discounts';
import { getBestDiscount } from '@/utils/discounts';

/**
 * Convierte ProductInCart a Product para calcular descuentos
 */
function cartItemToProduct(cartItem: ProductInCart) {
  return {
    id: cartItem.id,
    slug: cartItem.slug,
    title: cartItem.title,
    description: '',
    images: [cartItem.image],
    inStock: 0,
    price: cartItem.price,
    featured: false,
    companyId: '',
    categoryId: cartItem.categoryId,
    tags: cartItem.tags || []
  };
}

/**
 * Recalcula el descuento para un producto en el carrito basado en su cantidad actual
 */
export function recalculateCartItemDiscount(
  cartItem: ProductInCart,
  discounts: Discount[],
  cartTotal: number = 0
): ProductInCart {
  // Convertir cartItem a Product para calcular descuentos
  const product = cartItemToProduct(cartItem);
  
  // Recalcular descuento con la cantidad actual del carrito
  const appliedDiscount = getBestDiscount(discounts, product, cartItem.quantity, cartTotal, true);
  
  return {
    ...cartItem,
    discount: appliedDiscount && appliedDiscount.discountAmount > 0 ? {
      id: appliedDiscount.discount.id,
      name: appliedDiscount.discount.name,
      discountAmount: appliedDiscount.discountAmount,
      finalPrice: appliedDiscount.finalPrice,
      badgeText: appliedDiscount.badgeText
    } : undefined
  };
}

/**
 * Calcula el precio total de un item del carrito considerando descuentos
 */
export function getCartItemTotalPrice(cartItem: ProductInCart): number {
  const unitPrice = cartItem.discount ? cartItem.discount.finalPrice : cartItem.price;
  return unitPrice * cartItem.quantity;
}
