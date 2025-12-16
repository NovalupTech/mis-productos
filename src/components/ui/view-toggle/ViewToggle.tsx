'use client'

import { useState, useEffect } from 'react'
import { IoGridOutline, IoListOutline } from 'react-icons/io5'
import clsx from 'clsx'
import { useCatalogViewStore } from '@/store/catalog/catalog-view-store'

export type ViewMode = 'grid' | 'list'

interface Props {
  onViewChange?: (view: ViewMode) => void
  value?: ViewMode // Prop opcional para control externo
}

export const ViewToggle = ({ onViewChange, value }: Props) => {
  const { viewMode: storeViewMode, setViewMode: setStoreViewMode } = useCatalogViewStore()
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>('grid')

  // Si hay un value externo, usarlo; sino usar el store; sino usar el estado interno
  const viewMode = value ?? storeViewMode ?? internalViewMode

  // Sincronizar estado interno con el store cuando no hay value externo
  useEffect(() => {
    if (!value) {
      setInternalViewMode(storeViewMode)
    }
  }, [storeViewMode, value])

  const handleViewChange = (newView: ViewMode) => {
    if (!value) {
      // Si no hay control externo, actualizar el store y el estado interno
      setStoreViewMode(newView)
      setInternalViewMode(newView)
    }
    // Siempre llamar al callback si existe
    onViewChange?.(newView)
  }

  return (
    <div className="hidden md:flex items-center gap-1 border border-gray-300 rounded-md overflow-hidden">
      <button
        onClick={() => handleViewChange('grid')}
        className="p-2 transition-colors"
        style={{
          backgroundColor: viewMode === 'grid' 
            ? 'var(--theme-secondary-color)' 
            : 'var(--theme-primary-color)',
          color: viewMode === 'grid' ? '#ffffff' : '#374151',
        }}
        onMouseEnter={(e) => {
          if (viewMode !== 'grid') {
            e.currentTarget.style.backgroundColor = 'var(--theme-secondary-color-hover)';
            e.currentTarget.style.color = '#ffffff';
          }
        }}
        onMouseLeave={(e) => {
          if (viewMode !== 'grid') {
            e.currentTarget.style.backgroundColor = 'var(--theme-primary-color)';
            e.currentTarget.style.color = '#374151';
          }
        }}
        title="Vista de cuadrícula"
        aria-label="Vista de cuadrícula"
      >
        <IoGridOutline size={20} />
      </button>
      <button
        onClick={() => handleViewChange('list')}
        className="p-2 transition-colors"
        style={{
          backgroundColor: viewMode === 'list' 
            ? 'var(--theme-secondary-color)' 
            : 'var(--theme-primary-color)',
          color: viewMode === 'list' ? '#ffffff' : '#374151',
        }}
        onMouseEnter={(e) => {
          if (viewMode !== 'list') {
            e.currentTarget.style.backgroundColor = 'var(--theme-secondary-color-hover)';
            e.currentTarget.style.color = '#ffffff';
          }
        }}
        onMouseLeave={(e) => {
          if (viewMode !== 'list') {
            e.currentTarget.style.backgroundColor = 'var(--theme-primary-color)';
            e.currentTarget.style.color = '#374151';
          }
        }}
        title="Vista de listado"
        aria-label="Vista de listado"
      >
        <IoListOutline size={20} />
      </button>
    </div>
  )
}
