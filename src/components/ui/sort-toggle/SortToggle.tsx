'use client'

import { useState, useEffect } from 'react'
import { IoArrowUpOutline, IoArrowDownOutline } from 'react-icons/io5'
import { useCatalogSortStore } from '@/store/catalog/catalog-sort-store'

export type SortMode = 'none' | 'price-desc' | 'price-asc'

interface Props {
  onSortChange?: (sort: SortMode) => void
  value?: SortMode // Prop opcional para control externo
}

export const SortToggle = ({ onSortChange, value }: Props) => {
  const { sortMode: storeSortMode, setSortMode: setStoreSortMode } = useCatalogSortStore()
  const [internalSortMode, setInternalSortMode] = useState<SortMode>('none')

  // Si hay un value externo, usarlo; sino usar el store; sino usar el estado interno
  const sortMode = value ?? storeSortMode ?? internalSortMode

  // Sincronizar estado interno con el store cuando no hay value externo
  useEffect(() => {
    if (!value) {
      setInternalSortMode(storeSortMode)
    }
  }, [storeSortMode, value])

  const handleSortChange = (newSort: SortMode) => {
    if (!value) {
      // Si no hay control externo, actualizar el store y el estado interno
      setStoreSortMode(newSort)
      setInternalSortMode(newSort)
    }
    // Siempre llamar al callback si existe
    onSortChange?.(newSort)
  }

  return (
    <div className="flex items-center gap-1 border border-gray-300 rounded-md overflow-hidden">
      <button
        onClick={() => handleSortChange('price-desc')}
        className="px-2 sm:px-3 py-1.5 sm:py-2 transition-colors flex items-center gap-1 sm:gap-1.5"
        style={{
          backgroundColor: sortMode === 'price-desc' 
            ? 'var(--theme-secondary-color)' 
            : 'var(--theme-primary-color)',
          color: sortMode === 'price-desc' 
            ? 'var(--theme-secondary-text-color)' 
            : 'var(--theme-primary-text-color)',
        }}
        onMouseEnter={(e) => {
          if (sortMode !== 'price-desc') {
            e.currentTarget.style.backgroundColor = 'var(--theme-secondary-color-hover)';
            e.currentTarget.style.color = 'var(--theme-secondary-text-color)';
          }
        }}
        onMouseLeave={(e) => {
          if (sortMode !== 'price-desc') {
            e.currentTarget.style.backgroundColor = 'var(--theme-primary-color)';
            e.currentTarget.style.color = 'var(--theme-primary-text-color)';
          }
        }}
        title="Mayor precio"
        aria-label="Ordenar por mayor precio"
      >
        <IoArrowDownOutline size={16} className="sm:w-[18px] sm:h-[18px]" />
        <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Mayor precio</span>
      </button>
      <button
        onClick={() => handleSortChange('price-asc')}
        className="px-2 sm:px-3 py-1.5 sm:py-2 transition-colors flex items-center gap-1 sm:gap-1.5"
        style={{
          backgroundColor: sortMode === 'price-asc' 
            ? 'var(--theme-secondary-color)' 
            : 'var(--theme-primary-color)',
          color: sortMode === 'price-asc' 
            ? 'var(--theme-secondary-text-color)' 
            : 'var(--theme-primary-text-color)',
        }}
        onMouseEnter={(e) => {
          if (sortMode !== 'price-asc') {
            e.currentTarget.style.backgroundColor = 'var(--theme-secondary-color-hover)';
            e.currentTarget.style.color = 'var(--theme-secondary-text-color)';
          }
        }}
        onMouseLeave={(e) => {
          if (sortMode !== 'price-asc') {
            e.currentTarget.style.backgroundColor = 'var(--theme-primary-color)';
            e.currentTarget.style.color = 'var(--theme-primary-text-color)';
          }
        }}
        title="Menor precio"
        aria-label="Ordenar por menor precio"
      >
        <IoArrowUpOutline size={16} className="sm:w-[18px] sm:h-[18px]" />
        <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Menor precio</span>
      </button>
    </div>
  )
}
