'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Product, ProductInCart } from '@/interfaces'
import { useCartStore } from '@/store/cart/cart-store'

interface Props {
    product: Product
}

const ProductGridItem = ({product}: Props) => {

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
      router.push(`/product/${product.slug}`);
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
      className='rounded-md overflow-hidden fade-in relative group'
      onMouseEnter={() => {
        setIsHovered(true);
        if (product.images[1]) setImage(product.images[1]);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setImage(product.images[0]);
      }}
    >
        <Link href={`/product/${product.slug}`}  className='block relative'>
            <Image
                src={`/products/${image}`}
                alt={product.title}
                width={500}
                height={500}
                className='w-full object-cover rounded transition-transform duration-300 group-hover:scale-105'
            />
            {/* Overlay con botones */}
            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-3 transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
              <button
                onClick={handleBuyClick}
                className='bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors duration-200'
              >
                Comprar
              </button>
            </div>
        </Link>
        <div className='p-4 flex flex-col'>
            <Link className='hover:text-blue-600' href={`/product/${product.slug}`}>
                {product.title}
            </Link>
            <span className='font-bold'>${product.price}</span>
            {product.tags && product.tags.length > 0 && (
              <div className='flex flex-wrap gap-1 mt-2'>
                {product.tags.slice(0, 3).map(tag => (
                  <span 
                    key={tag.id} 
                    className='text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded'
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
        </div>
    </div>
  )
}

export default ProductGridItem;
export { ProductGridItem };
