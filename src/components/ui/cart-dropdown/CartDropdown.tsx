'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/store/cart/cart-store'
import { formatPrice } from '@/utils'
import { usePriceConfig } from '@/components/providers/PriceConfigProvider'
import { useDiscounts } from '@/components/providers/DiscountProvider'
import { ProductAttributeWithDetails, ProductInCart } from '@/interfaces'
import { getProductBySlug } from '@/actions/product/get-product-by-slug'
import { IoCloseOutline, IoTrashOutline } from 'react-icons/io5'
import { QuantitySelector } from '@/components'
import { recalculateCartItemDiscount, getCartItemTotalPrice } from '@/utils/cart-discounts'
import clsx from 'clsx'

interface Props {
  isVisible: boolean
}

export const CartDropdown = ({ isVisible }: Props) => {
  const priceConfig = usePriceConfig();
  const { discounts } = useDiscounts();
  const { cart, getSummaryInformation, removeProduct, updateProductQuantity, clearCart, getCartTotal } = useCartStore(state => state)
  const [loaded, setLoaded] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [productAttributes, setProductAttributes] = useState<Record<string, ProductAttributeWithDetails[]>>({})
  const summaryInformation = getSummaryInformation(priceConfig)
  const cartTotal = getCartTotal();

  useEffect(() => {
    setLoaded(true)
  }, [])

  if (!loaded || cart.length === 0) return null

  return (
    <div 
      className={`absolute right-0 top-full w-96 rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
      }`}
      style={{
        backgroundColor: 'var(--theme-primary-color)',
      }}
    >
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-lg">Carrito de compras</h3>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 text-sm"
            title="Vaciar carrito"
          >
            <IoTrashOutline className="w-4 h-4" />
            <span className="hidden sm:inline">Vaciar</span>
          </button>
        )}
      </div>
      
      {/* Lista de productos */}
      <div className="overflow-y-auto flex-1 max-h-[400px]">
        {cart.map((product) => {
          const key = `${product.id}-${product.selectedAttributes}`
          const isExpanded = expandedItems.has(key)
          const availableAttributes = productAttributes[product.slug] || []
          
          return (
            <div 
              key={`${product.slug}-${product.selectedAttributes}`} 
              className="group relative p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex gap-3">
                <Link href={`/catalog/product/${product.slug}`} className="flex-shrink-0">
                  <Image
                    src={product.image.startsWith('http') || product.image.startsWith('https') ? product.image : `/products/${product.image}`}
                    width={60}
                    height={60}
                    alt={product.title}
                    className="rounded object-cover"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link 
                    href={`/catalog/product/${product.slug}`}
                    className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-1 block"
                  >
                    {product.title}
                  </Link>

                  {/* Cantidad */}
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Cantidad:</p>
                    <QuantitySelector 
                      quantity={product.quantity} 
                      onQuantityChanged={(quantity) => {
                        // Actualizar cantidad y recalcular descuento
                        const updatedProduct = { ...product, quantity };
                        const updatedWithDiscount = recalculateCartItemDiscount(updatedProduct, discounts, cartTotal);
                        updateProductQuantity(updatedWithDiscount, quantity);
                      }} 
                    />
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex flex-col">
                      {(() => {
                        // Recalcular descuento con la cantidad actual
                        const cartItemWithDiscount = recalculateCartItemDiscount(product, discounts, cartTotal);
                        const appliedDiscount = cartItemWithDiscount.discount;
                        const totalPrice = getCartItemTotalPrice(cartItemWithDiscount);
                        const totalOriginalPrice = product.price * product.quantity;
                        const hasDiscount = appliedDiscount !== null && totalOriginalPrice > totalPrice;

                        return (
                          <>
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
                            <span className={`text-sm font-semibold ${hasDiscount ? 'text-green-600' : ''}`}>
                              {formatPrice(totalPrice, priceConfig) || '-'}
                            </span>
                            {appliedDiscount && (
                              <span className="text-xs text-blue-600 mt-0.5">
                                {appliedDiscount.name}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <button
                      onClick={() => removeProduct(product)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50"
                      title="Eliminar producto"
                    >
                      <IoCloseOutline className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Resumen */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatPrice(Number(summaryInformation.subTotal.toFixed(2)), priceConfig) || '-'}</span>
          </div>
          {summaryInformation.discountTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-red-600">Descuentos</span>
              <span className="font-medium text-red-600">-{formatPrice(Number(summaryInformation.discountTotal.toFixed(2)), priceConfig) || '-'}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {priceConfig.enableTax && priceConfig.taxValue && priceConfig.taxValue > 0
                ? priceConfig.taxType === 'percentage'
                  ? `Impuestos (${priceConfig.taxValue}%)`
                  : 'Impuestos'
                : 'Impuestos'}
            </span>
            <span className="font-medium">{formatPrice(Number(summaryInformation.tax.toFixed(2)), priceConfig) || '-'}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
            <span>Total</span>
            <span>{formatPrice(Number(summaryInformation.total.toFixed(2)), priceConfig) || '-'}</span>
          </div>
        </div>
        <Link 
          href="/catalog/cart"
          className="block w-full text-center text-white py-2 px-4 rounded-md transition-colors font-medium"
          style={{
            backgroundColor: 'var(--theme-secondary-color)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--theme-secondary-color-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--theme-secondary-color)';
          }}
        >
          Ver carrito completo
        </Link>
      </div>
    </div>
  )
}

