'use client';

import { useEffect, useState, useRef } from 'react';
import { Product } from '@/interfaces';
import { getProductsForCarousel } from '@/actions/product/get-products-for-carousel';
import { ProductGridItem } from '@/components/ui/product-grid/ProductGridItem';
import { IoChevronBackOutline, IoChevronForwardOutline } from 'react-icons/io5';

interface CarouselSectionProps {
  content: Record<string, unknown>;
  config?: Record<string, unknown> | null;
}

export const CarouselSection = ({ content, config }: CarouselSectionProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  const title = (content.title as string) || '';
  const productIds = content.productIds as string[] | undefined;
  const search = content.search as string | undefined;
  const categoryIds = content.categoryIds as string[] | undefined;
  const tagIds = content.tagIds as string[] | undefined;
  const featured = content.featured as boolean | undefined;
  const limit = (config?.limit as number) || 20;

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const fetchedProducts = await getProductsForCarousel({
          productIds,
          search,
          categoryIds,
          tagIds,
          featured,
          limit,
        });
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Error al cargar productos del carousel:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [productIds, search, categoryIds, tagIds, featured, limit]);

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <section className="py-8 px-4">
        {title && (
          <h2 className="text-2xl font-bold mb-6 text-center">{title}</h2>
        )}
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-8 px-4 relative">
      {title && (
        <h2 className="text-2xl font-bold mb-6 text-center">{title}</h2>
      )}
      
      <div className="relative">
        {/* Botón anterior */}
        {products.length > 3 && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all flex items-center justify-center w-10 h-10"
            aria-label="Anterior"
          >
            <IoChevronBackOutline size={24} />
          </button>
        )}

        {/* Contenedor del carousel */}
        <div
          ref={carouselRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-64"
            >
              <ProductGridItem product={product} imageSize="medium" />
            </div>
          ))}
        </div>

        {/* Botón siguiente */}
        {products.length > 3 && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all flex items-center justify-center w-10 h-10"
            aria-label="Siguiente"
          >
            <IoChevronForwardOutline size={24} />
          </button>
        )}
      </div>
    </section>
  );
};
