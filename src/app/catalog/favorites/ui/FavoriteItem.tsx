'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart/cart-store'
import { usePriceConfig } from '@/components/providers/PriceConfigProvider'
import { useDiscounts } from '@/components/providers/DiscountProvider'
import { formatPrice } from '@/utils'
import { getBestDiscount } from '@/utils/discounts'
import { toggleFavorite } from '@/actions/favorites/toggle-favorite'
import { RequiredAttributesModal, DiscountBadge } from '@/components'
import { ProductInCart } from '@/interfaces'
import { IoHeart, IoTrashOutline } from 'react-icons/io5'
import { Tag } from '@prisma/client'
import { Product } from '@/interfaces'

interface Favorite {
  id: string
  createdAt: Date
    product: {
      id: string
      title: string
      description: string
      price: number
      slug: string
      inStock: number
      companyId: string
      productImage: Array<{ url: string }>
      category: {
        id: string
        name: string
        companyId: string
      }
    tags: Array<{
      tag: {
        id: string
        name: string
      }
    }>
    ProductAttribute: Array<{
      id: string
      productId: string
      attributeId: string
      attributeValueId: string | null
      valueText: string | null
      valueNumber: number | null
      attribute: {
        id: string
        name: string
        type: string
        required: boolean
        companyId: string
      }
      attributeValue: {
        id: string
        value: string
      } | null
    }>
  }
}

interface Props {
  favorite: Favorite
}

export const FavoriteItem = ({ favorite }: Props) => {
  const router = useRouter()
  const priceConfig = usePriceConfig()
  const { discounts } = useDiscounts()
  const addProductToCart = useCartStore(state => state.addProductToCart)
  const [isRemoving, setIsRemoving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Transformar el producto del favorito al formato Product
  const product = {
    id: favorite.product.id,
    title: favorite.product.title,
    description: favorite.product.description,
    price: favorite.product.price,
    slug: favorite.product.slug,
    inStock: favorite.product.inStock,
    images: favorite.product.productImage.map(img => img.url),
    categoryId: favorite.product.category.id,
    companyId: favorite.product.companyId,
    tags: favorite.product.tags.map(pt => pt.tag),
    attributes: favorite.product.ProductAttribute.map(pa => ({
      id: pa.id,
      productId: pa.productId,
      attributeId: pa.attributeId,
      attributeValueId: pa.attributeValueId,
      valueText: pa.valueText,
      valueNumber: pa.valueNumber,
      attribute: pa.attribute,
      attributeValue: pa.attributeValue,
    })),
  }

  // Calcular descuento aplicable
  const appliedDiscount = getBestDiscount(discounts, product as Product, 1, 0, false)
  const displayPrice = appliedDiscount && appliedDiscount.discountAmount > 0 
    ? appliedDiscount.finalPrice 
    : product.price
  const formattedPrice = formatPrice(displayPrice, priceConfig)
  const originalPrice = appliedDiscount && appliedDiscount.discountAmount > 0 
    ? formatPrice(product.price, priceConfig) 
    : null

  // Verificar si el producto tiene atributos obligatorios
  const hasRequiredAttributes = product.attributes?.some(attr => 
    attr.attribute.required === true
  ) || false

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Si tiene atributos obligatorios, abrir el modal
    if (hasRequiredAttributes) {
      setIsModalOpen(true)
      return
    }

    // Si no tiene atributos obligatorios, agregar directamente al carrito
    const discountForCart = getBestDiscount(discounts, product as Product, 1, 0, true)
    
    const productCart: ProductInCart = {
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      quantity: 1,
      image: product.images[0],
      categoryId: product.categoryId,
      tags: product.tags as Tag[],
      selectedAttributes: undefined,
      discount: discountForCart && discountForCart.discountAmount > 0 ? {
        id: discountForCart.discount.id,
        name: discountForCart.discount.name,
        discountAmount: discountForCart.discountAmount,
        finalPrice: discountForCart.finalPrice,
        badgeText: discountForCart.badgeText
      } : undefined
    }

    addProductToCart(productCart)
  }

  const handleRemoveFavorite = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsRemoving(true)
    const result = await toggleFavorite(product.id)
    if (result.ok && !result.isFavorite) {
      // Recargar la página para actualizar la lista
      router.refresh()
    }
    setIsRemoving(false)
  }

  const productImage = product.images[0] || '/logo.png'

  return (
    <>
      <div 
        className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
        style={{
          backgroundColor: 'var(--theme-primary-color)',
        }}
      >
        {/* Imagen a la izquierda */}
        <a 
          href={`/catalog/product/${product.slug}`} 
          className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 overflow-hidden rounded-md"
        >
          <Image
            src={productImage.startsWith('http') || productImage.startsWith('https') ? productImage : `/products/${productImage}`}
            alt={product.title}
            width={128}
            height={128}
            className="w-full h-full object-cover"
            style={{ viewTransitionName: `product-image-${product.slug}` }}
          />
          {/* Badge de descuento */}
          {appliedDiscount && (
            <div className="absolute top-1 left-1 z-10">
              <DiscountBadge text={appliedDiscount.badgeText} />
            </div>
          )}
        </a>
        
        {/* Detalles del producto */}
        <div className="flex-1 min-w-0">
          <Link 
            href={`/catalog/product/${product.slug}`}
            className="block hover:text-blue-600 transition-colors"
          >
            <h3 className="font-semibold text-lg mb-1 line-clamp-2">{product.title}</h3>
          </Link>
          
          {product.description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
          )}
          
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              {formattedPrice && (
                <span 
                  className="font-bold text-xl"
                  style={{
                    color: 'var(--theme-secondary-color)',
                  }}
                >
                  {formattedPrice}
                </span>
              )}
              {originalPrice && (
                <span className="text-sm text-gray-500 line-through">
                  {originalPrice}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddToCart}
                className="px-6 py-2 rounded-md font-semibold transition-colors whitespace-nowrap"
                style={{
                  backgroundColor: 'var(--theme-secondary-color)',
                  color: 'var(--theme-secondary-text-color)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--theme-secondary-color-hover)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--theme-secondary-color)'
                }}
              >
                Agregar al carrito
              </button>
              
              <button
                onClick={handleRemoveFavorite}
                disabled={isRemoving}
                className="p-2 rounded-md transition-colors border border-gray-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Eliminar de favoritos"
                title="Eliminar de favoritos"
              >
                {isRemoving ? (
                  <IoHeart className="w-5 h-5 text-gray-400" />
                ) : (
                  <IoTrashOutline className="w-5 h-5 text-gray-600 hover:text-red-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de atributos obligatorios */}
      <RequiredAttributesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product as Product}
        onAddToCart={() => {}}
      />
    </>
  )
}
