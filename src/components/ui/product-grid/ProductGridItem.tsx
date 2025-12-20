'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Product, ProductInCart } from '@/interfaces'
import { useCartStore } from '@/store/cart/cart-store'
import { formatPrice } from '@/utils'
import { usePriceConfig } from '@/components/providers/PriceConfigProvider'
import { useDiscounts } from '@/components/providers/DiscountProvider'
import { RequiredAttributesModal, DiscountBadge } from '@/components'
import { getBestDiscount, formatDiscountBadge } from '@/utils/discounts'
import { toggleFavorite } from '@/actions/favorites/toggle-favorite'
import { checkFavorite } from '@/actions/favorites/check-favorite'
import { IoHeart, IoHeartOutline } from 'react-icons/io5'

interface Props {
    product: Product
    selectedTag?: string
    imageSize?: 'small' | 'medium' | 'large'
}

const ProductGridItem = ({product, selectedTag, imageSize = 'medium'}: Props) => {
  const priceConfig = usePriceConfig();
  const { discounts } = useDiscounts();
  const { data: session } = useSession();
  const [image, setImage] = useState(product.images[0]);
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const addProductToCart = useCartStore(state => state.addProductToCart);
  const router = useRouter();

  // Verificar si el producto está en favoritos cuando el componente se monta
  useEffect(() => {
    if (session?.user) {
      checkFavorite(product.id).then(setIsFavorite);
    }
  }, [session?.user, product.id]);

  // Calcular descuento aplicable (no verificar condiciones para mostrar badges de BUY_X_GET_Y)
  const appliedDiscount = getBestDiscount(discounts, product, 1, 0, false);
  // Para BUY_X_GET_Y, mostrar precio normal si no cumple cantidad mínima, pero mostrar badge
  const displayPrice = appliedDiscount && appliedDiscount.discountAmount > 0 
    ? appliedDiscount.finalPrice 
    : product.price;
  const formattedPrice = formatPrice(displayPrice, priceConfig);
  const originalPrice = appliedDiscount && appliedDiscount.discountAmount > 0 
    ? formatPrice(product.price, priceConfig) 
    : null;

  // Verificar si el producto tiene atributos obligatorios
  const hasRequiredAttributes = product.attributes?.some(attr => 
    attr.attribute.required === true
  ) || false;

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Si tiene atributos obligatorios, abrir el modal
    if (hasRequiredAttributes) {
      setIsModalOpen(true);
      return;
    }

    // Si no tiene atributos obligatorios, agregar directamente al carrito
    // Recalcular descuento con cantidad 1 y verificando condiciones para aplicar correctamente
    const discountForCart = getBestDiscount(discounts, product, 1, 0, true);
    
    const productCart: ProductInCart = {
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      quantity: 1,
      image: product.images[0],
      categoryId: product.categoryId,
      tags: product.tags,
      selectedAttributes: undefined,
      discount: discountForCart && discountForCart.discountAmount > 0 ? {
        id: discountForCart.discount.id,
        name: discountForCart.discount.name,
        discountAmount: discountForCart.discountAmount,
        finalPrice: discountForCart.finalPrice,
        badgeText: discountForCart.badgeText
      } : undefined
    };

    addProductToCart(productCart);
  };

  const handleViewDetails = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/catalog/product/${product.slug}`);
  };

  const handleToggleFavorite = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!session?.user) {
      router.push('/login');
      return;
    }

    setIsLoadingFavorite(true);
    const result = await toggleFavorite(product.id);
    if (result.ok) {
      setIsFavorite(result.isFavorite || false);
    }
    setIsLoadingFavorite(false);
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
          <a 
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
            {/* Badge de descuento */}
            {appliedDiscount && (
              <div className="absolute top-2 left-2 z-10">
                <DiscountBadge text={appliedDiscount.badgeText} />
              </div>
            )}
            {/* Botón de favorito - Solo visible si el usuario está logueado */}
            {session?.user && (
              <button
                onClick={handleToggleFavorite}
                disabled={isLoadingFavorite}
                className="absolute top-2 right-2 z-10 p-2 bg-white/90 hover:bg-white rounded-full transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              >
                {isFavorite ? (
                  <IoHeart className="w-5 h-5" style={{ color: 'var(--theme-secondary-color)' }} />
                ) : (
                  <IoHeartOutline className="w-5 h-5 text-gray-700" />
                )}
              </button>
            )}
            {/* Overlay con botones - Solo visible en desktop */}
            <div className={`hidden sm:flex absolute inset-0 bg-black/20 items-center justify-center transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
              <div className='flex flex-col gap-2'>
                <button
                  onClick={handleAddToCart}
                  className='text-white px-6 py-3 rounded-md font-semibold transition-colors duration-200 w-full'
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
                  Agregar
                </button>
                {/* <button
                  onClick={handleViewDetails}
                  className='text-white px-6 py-3 rounded-md font-semibold transition-colors duration-200 w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30'
                >
                  Ver detalles
                </button> */}
              </div>
            </div>
          </a>
        </div>
        
        {/* Contenido - En mobile se expande, en desktop ocupa el espacio restante */}
        <div className='p-3 sm:p-4 flex flex-col flex-grow min-w-0'>
            <Link className='hover:text-blue-600 line-clamp-2 mb-1 text-sm sm:text-base' href={`/catalog/product/${product.slug}`}>
                {product.title}
            </Link>
            <div className="flex items-center gap-2 flex-wrap">
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
              {originalPrice && (
                <span className='text-sm text-gray-500 line-through'>
                  {originalPrice}
                </span>
              )}
            </div>
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
            {/* Botones visibles solo en mobile */}
            <div className='mt-2 sm:hidden flex flex-col gap-2'>
              <button
                onClick={handleAddToCart}
                className='text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors w-full'
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
                Agregar
              </button>
              {/* <Link
                href={`/catalog/product/${product.slug}`}
                className='text-center text-gray-700 px-4 py-2 rounded-md text-sm font-semibold transition-colors w-full border border-gray-300 hover:bg-gray-50'
              >
                Ver detalles
              </Link> */}
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

export default ProductGridItem;
export { ProductGridItem };
