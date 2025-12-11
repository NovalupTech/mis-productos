'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/store/cart/cart-store'
import { formatCurrency } from '@/utils'
import { ProductAttributeWithDetails, ProductInCart } from '@/interfaces'
import { getProductBySlug } from '@/actions/product/get-product-by-slug'
import { IoCloseOutline, IoTrashOutline } from 'react-icons/io5'
import { QuantitySelector } from '@/components'
import clsx from 'clsx'

interface Props {
  isVisible: boolean
}

export const CartDropdown = ({ isVisible }: Props) => {
  const { cart, getSummaryInformation, removeProduct, updateProductQuantity, clearCart } = useCartStore(state => state)
  const [loaded, setLoaded] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [productAttributes, setProductAttributes] = useState<Record<string, ProductAttributeWithDetails[]>>({})
  const summaryInformation = getSummaryInformation()

  useEffect(() => {
    setLoaded(true)
  }, [])

  if (!loaded || cart.length === 0) return null

  return (
    <div className={`absolute right-0 top-full w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
    }`}>
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
                <Link href={`/product/${product.slug}`} className="flex-shrink-0">
                  <Image
                    src={`/products/${product.image}`}
                    width={60}
                    height={60}
                    alt={product.title}
                    className="rounded object-cover"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link 
                    href={`/product/${product.slug}`}
                    className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-1 block"
                  >
                    {product.title}
                  </Link>

                  {/* Cantidad */}
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Cantidad:</p>
                    <QuantitySelector 
                      quantity={product.quantity} 
                      onQuantityChanged={(quantity) => updateProductQuantity(product, quantity)} 
                    />
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-semibold">{formatCurrency(product.price * product.quantity)}</span>
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
            <span className="font-medium">{formatCurrency(summaryInformation.subTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Impuestos (15%)</span>
            <span className="font-medium">{formatCurrency(summaryInformation.tax)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
            <span>Total</span>
            <span>{formatCurrency(summaryInformation.total)}</span>
          </div>
        </div>
        <Link 
          href="/cart"
          className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Ver carrito completo
        </Link>
      </div>
    </div>
  )
}

