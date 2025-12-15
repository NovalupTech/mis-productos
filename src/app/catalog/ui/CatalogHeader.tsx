'use client';

import { ViewToggle, ViewMode } from '@/components/ui/view-toggle/ViewToggle';
import { RemoveTagButton } from './RemoveTagButton';

interface CatalogHeaderProps {
  tag?: string;
  search?: string;
  viewMode?: ViewMode;
  onViewChange?: (view: ViewMode) => void;
}

export const CatalogHeader = ({ tag, search, viewMode, onViewChange }: CatalogHeaderProps) => {
  // Determinar el título a mostrar
  const getTitle = () => {
    if (tag) return `Productos con tag: ${tag}`;
    if (search) return `Resultados de la búsqueda: ${search}`;
    return 'Todos los productos';
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mt-3">
        {/* Título y botón de remover tag */}
        <div className="flex items-center gap-2 flex-1">
          <h2 className="text-xl pl-4 sm:pl-0">{getTitle()}</h2>
          {tag && <RemoveTagButton />}
        </div>

        {/* Selector de vista */}
        <div className="flex items-center">
          <ViewToggle value={viewMode} onViewChange={onViewChange} />
        </div>
      </div>
    </div>
  );
};
