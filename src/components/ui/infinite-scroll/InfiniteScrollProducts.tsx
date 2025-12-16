'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Product } from '@/interfaces'
import { ProductGrid } from '../product-grid/ProductGrid'
import { ProductList } from '../product-list/ProductList'
import { ViewToggle, ViewMode } from '../view-toggle/ViewToggle'
import { getPaginatedProductsWithImages } from '@/actions'
import { useCatalogViewStore } from '@/store/catalog/catalog-view-store'

interface InfiniteScrollProductsProps {
  initialProducts: Product[]
  initialPage: number
  initialTotalPages: number
  search?: string
  tag?: string
  attributeFilters?: Record<string, string>
  catalogColumns?: number
  catalogImageSize?: 'small' | 'medium' | 'large'
  viewMode?: ViewMode
  onViewModeChange?: (view: ViewMode) => void
}

export const InfiniteScrollProducts = ({
  initialProducts,
  initialPage,
  initialTotalPages,
  search,
  tag,
  attributeFilters,
  catalogColumns = 4,
  catalogImageSize = 'medium',
  viewMode: externalViewMode,
  onViewModeChange,
}: InfiniteScrollProductsProps) => {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialPage < initialTotalPages)
  const observerTarget = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const prevFiltersRef = useRef<string>('')
  const { viewMode: storeViewMode } = useCatalogViewStore()

  // Usar viewMode externo si está disponible, sino usar el store
  const viewMode = externalViewMode ?? storeViewMode

  // Crear una clave única para detectar cambios en los filtros
  const filtersKey = JSON.stringify({ search, tag, attributeFilters })

  // Resetear productos cuando cambian los filtros o búsqueda
  useEffect(() => {
    // Solo resetear si realmente cambiaron los filtros
    if (prevFiltersRef.current !== filtersKey) {
      setProducts(initialProducts)
      setCurrentPage(initialPage)
      setTotalPages(initialTotalPages)
      setHasMore(initialPage < initialTotalPages)
      prevFiltersRef.current = filtersKey
    }
  }, [initialProducts, initialPage, initialTotalPages, filtersKey])

  const loadMoreProducts = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const nextPage = currentPage + 1
      const result = await getPaginatedProductsWithImages({
        page: nextPage,
        search,
        tag,
        attributeFilters,
      })

      if (result.products.length > 0) {
        setProducts((prev) => [...prev, ...(result.products as unknown as Product[])])
        setCurrentPage(nextPage)
        setHasMore(nextPage < result.totalPages)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading more products:', error)
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, isLoading, hasMore, search, tag, attributeFilters])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMoreProducts()
        }
      },
      {
        rootMargin: '100px', // Cargar 100px antes de llegar al final
      }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMore, isLoading, loadMoreProducts])

  return (
    <>
      {/* Vista de productos según el modo seleccionado */}
      {viewMode === 'grid' ? (
        <ProductGrid products={products} selectedTag={tag} columns={catalogColumns} imageSize={catalogImageSize} />
      ) : (
        <ProductList products={products} selectedTag={tag} />
      )}
      
      {products.length === 0 && (
        <p className="text-center mt-10 mb-20">No se encontraron productos</p>
      )}

      {/* Elemento observado para el scroll infinito */}
      {hasMore && (
        <div ref={observerTarget} className="h-20 flex items-center justify-center">
          {isLoading && (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Cargando más productos...</span>
            </div>
          )}
        </div>
      )}

      {!hasMore && products.length > 0 && (
        <p className="text-center mt-10 mb-20 text-gray-500">
          No hay más productos para mostrar
        </p>
      )}
    </>
  )
}
