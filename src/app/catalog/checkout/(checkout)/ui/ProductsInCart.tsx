'use client'

import { useEffect, useState } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { useCartStore } from "@/store/cart/cart-store";
import { formatPrice } from "@/utils";
import { usePriceConfig } from "@/components/providers/PriceConfigProvider";
import { useDiscounts } from "@/components/providers/DiscountProvider";
import { recalculateCartItemDiscount, getCartItemTotalPrice } from "@/utils/cart-discounts";

export const ProductsInCart = () => {
    const { cart, getCartTotal } = useCartStore(state => state)
    const { discounts } = useDiscounts();
    const [loaded, setLoaded] = useState(false)
    const priceConfig = usePriceConfig()
    const cartTotal = getCartTotal();

    useEffect(() => {
      setLoaded(true)
    }, [])
    
    if(!loaded) return <p>Loading...</p>

	if(loaded) if(cart.length === 0) redirect('/catalog/empty')

	return (
		<>
			{cart.map((product) => {
        // Recalcular descuento con la cantidad actual del carrito
        const cartItemWithDiscount = recalculateCartItemDiscount(product, discounts, cartTotal);
        const appliedDiscount = cartItemWithDiscount.discount || null;
        const totalPrice = getCartItemTotalPrice(cartItemWithDiscount);
        const totalOriginalPrice = product.price * product.quantity;
        const hasDiscount = appliedDiscount !== null && totalOriginalPrice > totalPrice;

        return (
          <div key={`${product.id}-${product.selectedAttributes ? JSON.stringify(product.selectedAttributes) : ''}`} className="flex mb-5 pb-5 border-b border-gray-200 last:border-0">
            <Image
              src={product.image.startsWith('http') || product.image.startsWith('https') ? product.image : `/products/${product.image}` as string}
              style={{
                width: "100px",
                height: "100px",
              }}
              width={100}
              height={100}
              alt={product.title}
              className="mr-5 rounded"
            />
            <div className="flex-1">
              <p className="font-semibold mb-1">{product.title} ({product.quantity})</p>
              
              {/* Precios */}
              <div className="mb-2">
                {hasDiscount && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(totalOriginalPrice, priceConfig)}
                    </span>
                    <span className="text-xs text-red-600 font-semibold">
                      -{formatPrice(totalOriginalPrice - totalPrice, priceConfig)}
                    </span>
                  </div>
                )}
                <p className={`font-bold ${hasDiscount ? 'text-green-600' : ''}`}>
                  {formatPrice(totalPrice, priceConfig) || '-'}
                </p>
                {appliedDiscount && (
                  <p className="text-xs text-blue-600 mt-1">
                    Promo: {appliedDiscount.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
		</>
	);
};
