import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ViewMode } from '@/components/ui/view-toggle/ViewToggle';

interface CatalogViewState {
  viewMode: ViewMode;
  setViewMode: (viewMode: ViewMode) => void;
}

// Función para migrar datos del localStorage antiguo
const migrateOldStorage = (): ViewMode => {
  if (typeof window === 'undefined') return 'grid';
  
  // Intentar leer del localStorage antiguo
  const oldView = localStorage.getItem('product-view-mode') as ViewMode | null;
  if (oldView === 'grid' || oldView === 'list') {
    // Limpiar el localStorage antiguo después de migrar
    localStorage.removeItem('product-view-mode');
    return oldView;
  }
  
  return 'grid';
};

export const useCatalogViewStore = create<CatalogViewState>()(
  persist(
    (set) => ({
      viewMode: migrateOldStorage(),
      setViewMode: (viewMode: ViewMode) => set({ viewMode }),
    }),
    {
      name: 'catalog-view-mode',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
