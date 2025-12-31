'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Product } from '@/interfaces'
import { ProductGrid } from '../product-grid/ProductGrid'
import { ProductList } from '../product-list/ProductList'
import { ViewToggle, ViewMode } from '../view-toggle/ViewToggle'
import { getPaginatedProductsWithImages } from '@/actions'
import { useCatalogViewStore } from '@/store/catalog/catalog-view-store'
import { useCatalogSortStore } from '@/store/catalog/catalog-sort-store'
import type { SortMode } from '@/store/catalog/catalog-sort-store'

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
  const isLoadingRef = useRef(false) // Ref para evitar llamadas concurrentes
  const { viewMode: storeViewMode } = useCatalogViewStore()
  const { sortMode } = useCatalogSortStore()

  // Usar viewMode externo si está disponible, sino usar el store
  const viewMode = externalViewMode ?? storeViewMode

  // Crear una clave única para detectar cambios en los filtros
  const filtersKey = JSON.stringify({ search, tag, attributeFilters })

  // Función para ordenar productos según el modo de ordenamiento
  const sortProducts = useCallback((productsToSort: Product[], sort: SortMode): Product[] => {
    // Si el modo es 'none', retornar los productos sin modificar (orden original del servidor)
    if (sort === 'none' || !sort) {
      return productsToSort
    }

    const sorted = [...productsToSort]
    
    if (sort === 'price-desc') {
      // Mayor precio primero
      return sorted.sort((a, b) => b.price - a.price)
    } else if (sort === 'price-asc') {
      // Menor precio primero
      return sorted.sort((a, b) => a.price - b.price)
    }

    return sorted
  }, [])

  // Productos ordenados según el modo de ordenamiento
  const sortedProducts = useMemo(() => {
    return sortProducts(products, sortMode)
  }, [products, sortMode, sortProducts])

  // Resetear productos cuando cambian los filtros o búsqueda
  useEffect(() => {
    // Solo resetear si realmente cambiaron los filtros
    if (prevFiltersRef.current !== filtersKey) {
      setProducts(initialProducts)
      setCurrentPage(initialPage)
      setTotalPages(initialTotalPages)
      setHasMore(initialPage < initialTotalPages)
      prevFiltersRef.current = filtersKey
      isLoadingRef.current = false // Resetear el flag de carga
    }
  }, [initialProducts, initialPage, initialTotalPages, filtersKey])

  // Usar refs para mantener los valores más recientes sin causar recreaciones del callback
  const filtersRef = useRef({ search, tag, attributeFilters })
  const currentPageRef = useRef(currentPage)
  const hasMoreRef = useRef(hasMore)

  // Actualizar refs cuando cambian los valores
  useEffect(() => {
    filtersRef.current = { search, tag, attributeFilters }
    currentPageRef.current = currentPage
    hasMoreRef.current = hasMore
  }, [search, tag, attributeFilters, currentPage, hasMore])

  // Sincronizar isLoadingRef con isLoading
  useEffect(() => {
    isLoadingRef.current = isLoading
  }, [isLoading])

  const loadMoreProducts = useCallback(async () => {
    // Usar refs para verificar el estado actual sin depender de los valores en el closure
    if (isLoadingRef.current || !hasMoreRef.current) return

    isLoadingRef.current = true
    setIsLoading(true)
    
    try {
      const nextPage = currentPageRef.current + 1
      const filters = filtersRef.current
      
      const result = await getPaginatedProductsWithImages({
        page: nextPage,
        search: filters.search,
        tag: filters.tag,
        attributeFilters: filters.attributeFilters,
      })

      if (result.products.length > 0) {
        setProducts((prev) => [...prev, ...(result.products as unknown as Product[])])
        setCurrentPage(nextPage)
        setHasMore(nextPage < result.totalPages)
        hasMoreRef.current = nextPage < result.totalPages
      } else {
        setHasMore(false)
        hasMoreRef.current = false
      }
    } catch (error) {
      console.error('Error loading more products:', error)
      setHasMore(false)
      hasMoreRef.current = false
    } finally {
      isLoadingRef.current = false
      setIsLoading(false)
    }
  }, []) // Sin dependencias - usa refs para acceder a valores actuales

  useEffect(() => {
    // Solo crear el observer si hay más productos para cargar
    if (!hasMore) return

    let observer: IntersectionObserver | null = null
    let currentTarget: HTMLDivElement | null = null

    // Pequeño delay para evitar que se dispare inmediatamente al montar
    const timeoutId = setTimeout(() => {
      observer = new IntersectionObserver(
        (entries) => {
          // Verificar usando refs para evitar condiciones de carrera
          if (entries[0].isIntersecting && hasMoreRef.current && !isLoadingRef.current) {
            loadMoreProducts()
          }
        },
        {
          rootMargin: '100px', // Cargar 100px antes de llegar al final
        }
      )

      currentTarget = observerTarget.current
      if (currentTarget) {
        observer.observe(currentTarget)
      }
    }, 100) // Delay de 100ms para evitar llamadas inmediatas

    return () => {
      clearTimeout(timeoutId)
      if (observer && currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMore, loadMoreProducts]) // Solo recrear cuando cambia hasMore o loadMoreProducts

  return (
    <>
      {/* Vista de productos según el modo seleccionado */}
      {viewMode === 'grid' ? (
        <ProductGrid products={sortedProducts} selectedTag={tag} columns={catalogColumns} imageSize={catalogImageSize} />
      ) : (
        <ProductList products={sortedProducts} selectedTag={tag} />
      )}
      
      {sortedProducts.length === 0 && (
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

      {!hasMore && sortedProducts.length > 0 && (
        <p className="text-center mt-10 mb-20 text-gray-500">
          No hay más productos para mostrar
        </p>
      )}
    </>
  )
}
