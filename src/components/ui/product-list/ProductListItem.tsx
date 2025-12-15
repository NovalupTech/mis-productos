'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Product, ProductInCart } from '@/interfaces'
import { useCartStore } from '@/store/cart/cart-store'
import { formatPrice } from '@/utils'
import { usePriceConfig } from '@/components/providers/PriceConfigProvider'
import { RequiredAttributesModal } from '@/components'

interface Props {
    product: Product
    selectedTag?: string
}

export const ProductListItem = ({product, selectedTag}: Props) => {
  const [image, setImage] = useState(product.images[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const addProductToCart = useCartStore(state => state.addProductToCart);
  const router = useRouter();
  const priceConfig = usePriceConfig();
  const formattedPrice = formatPrice(product.price, priceConfig);

  // Verificar si el producto tiene atributos obligatorios
  const hasRequiredAttributes = product.attributes?.some(attr => 
    attr.attribute.required === true
  ) || false;

  const handleBuyClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Si tiene atributos obligatorios, abrir el modal
    if (hasRequiredAttributes) {
      setIsModalOpen(true);
      return;
    }

    // Si no tiene atributos obligatorios, agregar directamente al carrito
    const productCart: ProductInCart = {
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      quantity: 1,
      image: product.images[0],
      selectedAttributes: undefined
    };

    addProductToCart(productCart);
  };

  return (
    <div 
      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
      style={{
        backgroundColor: 'var(--theme-primary-color)',
      }}
    >
      {/* Imagen a la izquierda */}
      <Link 
        href={`/catalog/product/${product.slug}`} 
        className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 overflow-hidden rounded-md"
      >
        <Image
          src={image.startsWith('http') || image.startsWith('https') ? image : `/products/${image}`}
          alt={product.title}
          width={128}
          height={128}
          className="w-full h-full object-cover"
          style={{ viewTransitionName: `product-image-${product.slug}` }}
        />
      </Link>
      
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
            
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {product.tags.slice(0, 3).map(tag => {
                  const isSelected = selectedTag === tag.name;
                  return (
                    <button
                      key={tag.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/catalog?tag=${encodeURIComponent(tag.name)}`);
                      }}
                      className={`text-xs px-2 py-1 rounded transition-colors cursor-pointer ${
                        isSelected
                          ? 'text-white font-semibold'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                      }`}
                      style={isSelected ? {
                        backgroundColor: 'var(--theme-secondary-color)',
                      } : {}}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          <button
            onClick={handleBuyClick}
            className="text-white px-6 py-2 rounded-md font-semibold transition-colors whitespace-nowrap"
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
            Comprar
          </button>
        </div>
      </div>

      {/* Modal de atributos obligatorios */}
      <RequiredAttributesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
        onAddToCart={() => {}}
      />
    </div>
  )
}
