'use client'

import { useState, useEffect } from 'react'
import { IoGridOutline, IoListOutline } from 'react-icons/io5'
import clsx from 'clsx'

export type ViewMode = 'grid' | 'list'

interface Props {
  onViewChange?: (view: ViewMode) => void
}

export const ViewToggle = ({ onViewChange }: Props) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // Cargar preferencia del localStorage al montar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedView = localStorage.getItem('product-view-mode') as ViewMode | null
      if (savedView === 'grid' || savedView === 'list') {
        setViewMode(savedView)
        onViewChange?.(savedView)
      }
    }
  }, [onViewChange])

  // Guardar preferencia en localStorage cuando cambia
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('product-view-mode', viewMode)
      onViewChange?.(viewMode)
    }
  }, [viewMode, onViewChange])

  return (
    <div className="flex items-center gap-1 border border-gray-300 rounded-md overflow-hidden">
      <button
        onClick={() => setViewMode('grid')}
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
        onClick={() => setViewMode('list')}
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
