'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Product, ProductInCart } from '@/interfaces'
import { useCartStore } from '@/store/cart/cart-store'

interface Props {
    product: Product
}

const ProductGridItem = ({product}: Props) => {

  const [image, setImage] = useState(product.images[0]);
  const [isHovered, setIsHovered] = useState(false);
  const addProductToCart = useCartStore(state => state.addProductToCart);

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.sizes.length === 0) return;

    const productCart: ProductInCart = {
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      quantity: 1,
      size: product.sizes[0],
      image: product.images[0]
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
        <Link href={`/product/${product.slug}`} className='block relative'>
            <Image
                src={`/products/${image}`}
                alt={product.title}
                width={500}
                height={500}
                className='w-full object-cover rounded transition-transform duration-300 group-hover:scale-105'
                layout='responsive'
            />
            {/* Overlay con botón de agregar al carrito */}
            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
              <button
                onClick={handleAddToCart}
                className='bg-white text-gray-900 px-6 py-3 rounded-md font-semibold hover:bg-gray-100 transition-colors duration-200 transform hover:scale-105'
                disabled={product.sizes.length === 0}
              >
                Agregar al carrito
              </button>
            </div>
        </Link>
        <div className='p-4 flex flex-col'>
            <Link className='hover:text-blue-600' href={`/product/${product.slug}`}>
                {product.title}
            </Link>
            <span className='font-bold'>${product.price}</span>
        </div>
    </div>
  )
}

export default ProductGridItem