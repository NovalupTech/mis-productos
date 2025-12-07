'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/store/cart/cart-store'
import { formatCurrency } from '@/utils'

interface Props {
  isVisible: boolean
}

export const CartDropdown = ({ isVisible }: Props) => {
  const { cart, getSummaryInformation } = useCartStore(state => state)
  const [loaded, setLoaded] = useState(false)
  const summaryInformation = getSummaryInformation()

  useEffect(() => {
    setLoaded(true)
  }, [])

  if (!loaded || cart.length === 0) return null

  return (
    <div className={`absolute right-0 top-full w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
    }`}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-lg">Carrito de compras</h3>
      </div>
      
      {/* Lista de productos */}
      <div className="overflow-y-auto flex-1 max-h-[400px]">
        {cart.map((product) => (
          <div key={`${product.slug}-${product.size}`} className="flex p-4 border-b border-gray-100 hover:bg-gray-50">
            <Image
              src={`/products/${product.image}`}
              width={60}
              height={60}
              alt={product.title}
              className="rounded object-cover flex-shrink-0"
            />
            <div className="ml-3 flex-1 min-w-0">
              <Link 
                href={`/product/${product.slug}`}
                className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-1"
              >
                {product.title}
              </Link>
              <p className="text-xs text-gray-500">Talla: {product.size}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">Cantidad: {product.quantity}</span>
                <span className="text-sm font-semibold">{formatCurrency(product.price * product.quantity)}</span>
              </div>
            </div>
          </div>
        ))}
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

