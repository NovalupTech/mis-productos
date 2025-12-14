'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Product, ProductInCart } from '@/interfaces'
import { useCartStore } from '@/store/cart/cart-store'
import { formatPrice } from '@/utils'
import { usePriceConfig } from '@/components/providers/PriceConfigProvider'

interface Props {
    product: Product
    selectedTag?: string
    imageSize?: 'small' | 'medium' | 'large'
}

const ProductGridItem = ({product, selectedTag, imageSize = 'medium'}: Props) => {
  const priceConfig = usePriceConfig();
  const formattedPrice = formatPrice(product.price, priceConfig);

  const [image, setImage] = useState(product.images[0]);
  const [isHovered, setIsHovered] = useState(false);
  const addProductToCart = useCartStore(state => state.addProductToCart);
  const router = useRouter();

  // Verificar si el producto tiene atributos requeridos (select/multiselect)
  const hasRequiredAttributes = product.attributes?.some(attr => 
    attr.attribute.type === 'select' || attr.attribute.type === 'multiselect'
  ) || false;

  const handleBuyClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Si tiene atributos requeridos, redirigir a la página del producto
    if (hasRequiredAttributes) {
      router.push(`/catalog/product/${product.slug}`);
      return;
    }

    // Si no tiene atributos requeridos, agregar directamente al carrito
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
      className='rounded-md overflow-hidden fade-in relative group flex flex-row sm:flex-col h-full border border-gray-200 sm:border-0'
      onMouseEnter={() => {
        setIsHovered(true);
        if (product.images[1]) setImage(product.images[1]);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setImage(product.images[0]);
      }}
    >
        {/* Imagen - En mobile ocupa menos espacio, en desktop según el tamaño configurado */}
        <div className={`w-32 sm:w-full flex-shrink-0 ${
          imageSize === 'small' ? 'sm:flex sm:justify-center sm:items-start' : ''
        }`}>
          <Link 
            href={`/catalog/product/${product.slug}`} 
            className={`block relative overflow-hidden aspect-square ${
              imageSize === 'small' 
                ? 'sm:w-[180px] sm:h-[180px]' // Pequeño: 180x180px
                : imageSize === 'large'
                ? 'sm:w-full sm:max-h-[450px]' // Grande: altura máxima 450px
                : 'sm:w-full sm:max-h-[280px]' // Medio: altura máxima 280px
            }`}
          >
            <Image
                src={image.startsWith('http') || image.startsWith('https') ? image : `/products/${image}`}
                alt={product.title}
                width={500}
                height={500}
                className='w-full h-full object-cover rounded sm:rounded transition-transform duration-300 group-hover:scale-105'
                style={{ viewTransitionName: `product-image-${product.slug}` }}
            />
            {/* Overlay con botones - Solo visible en desktop */}
            <div className={`hidden sm:flex absolute inset-0 bg-black/20 items-center justify-center gap-3 transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
              <button
                onClick={handleBuyClick}
                className='text-white px-6 py-3 rounded-md font-semibold transition-colors duration-200'
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
          </Link>
        </div>
        
        {/* Contenido - En mobile se expande, en desktop ocupa el espacio restante */}
        <div className='p-3 sm:p-4 flex flex-col flex-grow min-w-0'>
            <Link className='hover:text-blue-600 line-clamp-2 mb-1 text-sm sm:text-base' href={`/catalog/product/${product.slug}`}>
                {product.title}
            </Link>
            {formattedPrice && (
              <span 
                className='font-bold text-base sm:text-lg'
                style={{
                  color: 'var(--theme-secondary-color)',
                }}
              >
                {formattedPrice}
              </span>
            )}
            {product.tags && product.tags.length > 0 && (
              <div className='flex flex-wrap gap-1 mt-2'>
                {product.tags.slice(0, 3).map(tag => {
                  const isSelected = selectedTag === tag.name;
                  return (
                    <button
                      key={tag.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/catalog/?tag=${encodeURIComponent(tag.name)}`);
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
            {/* Botón comprar visible solo en mobile */}
            <button
              onClick={handleBuyClick}
              className='mt-2 sm:hidden text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors w-full'
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
  )
}

export default ProductGridItem;
export { ProductGridItem };
