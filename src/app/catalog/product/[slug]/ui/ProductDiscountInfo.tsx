'use client';

import { useEffect, useState } from 'react';
import { useDiscounts } from '@/components/providers/DiscountProvider';
import { DiscountBadge } from '@/components';
import { getBestDiscount } from '@/utils/discounts';
import { formatPrice } from '@/utils';
import type { Product } from '@/interfaces';
import type { PriceConfig } from '@/utils/priceFormat';

interface ProductDiscountInfoProps {
  product: Product;
  priceConfig?: PriceConfig;
  showPrice?: boolean;
}

export const ProductDiscountInfo = ({ product, priceConfig, showPrice = false }: ProductDiscountInfoProps) => {
  const { discounts, loading } = useDiscounts();
  const [appliedDiscount, setAppliedDiscount] = useState<ReturnType<typeof getBestDiscount>>(null);

  useEffect(() => {
    if (!loading && discounts.length > 0) {
      // No verificar condiciones para mostrar badges de BUY_X_GET_Y
      const discount = getBestDiscount(discounts, product, 1, 0, false);
      setAppliedDiscount(discount);
    }
  }, [discounts, loading, product]);

  if (loading || !appliedDiscount) {
    if (showPrice && priceConfig) {
      return (
        <p 
          className="text-lg mb-5 font-bold"
          style={{ color: 'var(--theme-secondary-color)' }}
        >
          {formatPrice(product.price, priceConfig)}
        </p>
      );
    }
    return null;
  }

  // Para BUY_X_GET_Y, mostrar precio normal si no cumple cantidad mínima
  const displayPrice = appliedDiscount.discountAmount > 0 
    ? appliedDiscount.finalPrice 
    : product.price;
  const originalPrice = product.price;
  const hasActiveDiscount = appliedDiscount.discountAmount > 0;

  if (showPrice && priceConfig) {
    return (
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <span 
            className={`text-lg font-bold ${hasActiveDiscount ? 'text-green-600' : ''}`}
            style={!hasActiveDiscount ? { color: 'var(--theme-secondary-color)' } : {}}
          >
            {formatPrice(displayPrice, priceConfig)}
          </span>
          {hasActiveDiscount && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(originalPrice, priceConfig)}
            </span>
          )}
          <DiscountBadge text={appliedDiscount.badgeText} />
        </div>
        <p className="text-sm text-blue-600">
          Promo: {appliedDiscount.discount.name}
        </p>
      </div>
    );
  }

  // Solo mostrar badge
  return (
    <div className="absolute top-2 left-2 z-10">
      <DiscountBadge text={appliedDiscount.badgeText} />
    </div>
  );
};
