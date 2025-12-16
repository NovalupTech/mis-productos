import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type SortMode = 'none' | 'price-desc' | 'price-asc';

interface CatalogSortState {
  sortMode: SortMode;
  setSortMode: (sortMode: SortMode) => void;
}

// Función para validar el valor del sortMode
const isValidSortMode = (value: any): value is SortMode => {
  return value === 'none' || value === 'price-desc' || value === 'price-asc';
};

// Función para obtener el valor inicial - siempre 'none' por defecto
// Los valores guardados se usarán solo después de que el usuario seleccione explícitamente un ordenamiento
const getInitialSortMode = (): SortMode => {
  // Siempre empezar en 'none' por defecto
  // El ordenamiento solo se aplicará cuando el usuario lo seleccione explícitamente
  return 'none';
};

export const useCatalogSortStore = create<CatalogSortState>()(
  persist(
    (set) => ({
      sortMode: getInitialSortMode(),
      setSortMode: (sortMode: SortMode) => {
        // Validar antes de establecer
        if (isValidSortMode(sortMode)) {
          set({ sortMode });
        } else {
          set({ sortMode: 'none' });
        }
      },
    }),
    {
      name: 'catalog-sort-mode',
      storage: createJSONStorage(() => localStorage),
      // Siempre empezar en 'none' al cargar desde localStorage
      // Esto asegura que nunca se aplique un ordenamiento automáticamente
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Siempre resetear a 'none' al cargar la página
          // El ordenamiento solo se aplicará cuando el usuario lo seleccione explícitamente
          state.sortMode = 'none';
        }
      },
      // Solo persistir si el valor NO es 'none'
      partialize: (state) => {
        if (state.sortMode === 'none') {
          // No persistir 'none', para que siempre empiece en 'none' por defecto
          return {};
        }
        return { sortMode: state.sortMode };
      },
    }
  )
);
