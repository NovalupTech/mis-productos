'use client';

import { ViewMode } from '@/components/ui/view-toggle/ViewToggle';
import { CatalogHeader } from './CatalogHeader';
import { InfiniteScrollProducts } from '@/components/ui/infinite-scroll/InfiniteScrollProducts';
import { Product } from '@/interfaces';
import { useCatalogViewStore } from '@/store/catalog/catalog-view-store';

interface CatalogHeaderWrapperProps {
  tag?: string;
  search?: string;
  initialProducts: Product[];
  initialPage: number;
  initialTotalPages: number;
  attributeFilters?: Record<string, string>;
  catalogColumns?: number;
  catalogImageSize?: 'small' | 'medium' | 'large';
}

export const CatalogHeaderWrapper = ({
  tag,
  search,
  initialProducts,
  initialPage,
  initialTotalPages,
  attributeFilters,
  catalogColumns,
  catalogImageSize,
}: CatalogHeaderWrapperProps) => {
  const { viewMode, setViewMode } = useCatalogViewStore();

  const handleViewChange = (view: ViewMode) => {
    setViewMode(view);
  };

  return (
    <>
      <CatalogHeader 
        tag={tag} 
        search={search}
        viewMode={viewMode}
        onViewChange={handleViewChange}
      />
      <InfiniteScrollProducts
        initialProducts={initialProducts}
        initialPage={initialPage}
        initialTotalPages={initialTotalPages}
        search={search}
        tag={tag}
        attributeFilters={attributeFilters}
        catalogColumns={catalogColumns}
        catalogImageSize={catalogImageSize}
        viewMode={viewMode}
      />
    </>
  );
};
