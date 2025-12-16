"use client"

import { useState, useEffect, useRef } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useCompanyStore } from "@/store/company/company-store";
import { IoCloseOutline } from "react-icons/io5";
import { SortToggle } from "@/components/ui/sort-toggle/SortToggle";
import { useCatalogSortStore } from "@/store/catalog/catalog-sort-store";

interface SearchProps {
  onClose: () => void;
}

export const Search = ({ onClose }: SearchProps) => {
  const searchParams = useSearchParams();
  const pathName = usePathname();
  const router = useRouter();
  const company = useCompanyStore((state) => state.company);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMountRef = useRef(true);
  const isInitializingRef = useRef(true);
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { sortMode, setSortMode } = useCatalogSortStore();

  // Inicializar filtros desde los search params
  useEffect(() => {
    if (!company) return;
    
    const initialFilters: Record<string, string> = {};
    company.attributes?.forEach((attr) => {
      const paramValue = searchParams.get(`filter_${attr.id}`);
      if (paramValue) {
        initialFilters[attr.id] = paramValue;
      }
    });
    setFilters(initialFilters);
    
    // Marcar que la inicialización está completa después de un pequeño delay
    setTimeout(() => {
      isInitialMountRef.current = false;
      isInitializingRef.current = false;
    }, 100);
  }, [company]); // Solo cuando cambia la compañía

  // Sincronizar search con searchParams cuando cambian externamente (navegación del navegador)
  useEffect(() => {
    if (isInitializingRef.current) return;
    
    const currentSearchParam = searchParams.get('search') || '';
    if (currentSearchParam !== search) {
      setSearch(currentSearchParam);
    }
    
    // Sincronizar filtros también
    if (company) {
      const currentFilters: Record<string, string> = {};
      company.attributes?.forEach((attr) => {
        const paramValue = searchParams.get(`filter_${attr.id}`);
        if (paramValue) {
          currentFilters[attr.id] = paramValue;
        }
      });
      
      // Comparar si hay diferencias
      const filtersChanged = Object.keys(currentFilters).length !== Object.keys(filters).length ||
        Object.keys(currentFilters).some(attrId => currentFilters[attrId] !== filters[attrId]);
      
      if (filtersChanged) {
        setFilters(currentFilters);
      }
    }
  }, [searchParams]); // Cuando cambian los searchParams externamente

  // Función para actualizar la URL con debounce
  const updateSearchUrl = (searchValue: string, currentFilters: Record<string, string>) => {
    const params = new URLSearchParams();
    
    // Agregar búsqueda de texto
    if (searchValue.trim()) {
      params.set('search', searchValue.trim());
    }
    
    // Agregar filtros de atributos
    Object.entries(currentFilters).forEach(([attrId, value]) => {
      if (value) {
        params.set(`filter_${attrId}`, value);
      }
    });
    
    // Usar replace en lugar de push para evitar perder el foco
    router.replace(`${pathName}?${params.toString()}`, { scroll: false });
    
    // Restaurar el foco al input después de un pequeño delay
    setTimeout(() => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  }

  // Debounce para la búsqueda de texto
  useEffect(() => {
    // No ejecutar en el montaje inicial
    if (isInitialMountRef.current) {
      return;
    }

    // Limpiar timeout anterior
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Crear nuevo timeout con debounce de 500ms
    debounceTimeoutRef.current = setTimeout(() => {
      updateSearchUrl(search, filters);
    }, 500);

    // Limpiar timeout al desmontar
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [search]); // Solo se ejecuta cuando cambia search

  // Actualizar URL inmediatamente cuando cambian los filtros (sin debounce)
  useEffect(() => {
    // No ejecutar en el montaje inicial
    if (isInitialMountRef.current) {
      return;
    }

    updateSearchUrl(search, filters);
  }, [filters]); // Se ejecuta cuando cambian los filtros

  const handleFilterChange = (attrId: string, value: string) => {
    const newFilters = {
      ...filters,
      [attrId]: value,
    };
    setFilters(newFilters);
  }

  const clearFilters = () => {
    setFilters({});
    setSearch('');
    router.replace(pathName, { scroll: false });
    
    // Restaurar el foco al input después de limpiar
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  }

  const handleClose = () => {
    onClose();
  }

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        // No cerramos automáticamente, dejamos que el TopMenu maneje la visibilidad
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Solo mostrar atributos de tipo select o multiselect que tengan valores
  const filterableAttributes = company?.attributes?.filter(
    (attr) => (attr.type === 'select' || attr.type === 'multiselect') && attr.values.length > 0
  ) || [];

  return (
    <div ref={searchRef} className="w-full">
      <div className="flex flex-col gap-3">
        {/* Input de búsqueda y botones */}
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            autoFocus
          />
          {(Object.keys(filters).length > 0 || search) && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              Limpiar
            </button>
          )}
          <button
            onClick={handleClose}
            className="px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            title="Cerrar búsqueda"
          >
            <IoCloseOutline className="w-5 h-5" />
          </button>
        </div>

        {/* Ordenamiento */}
        <div className="flex flex-col gap-2">
          <label className="block text-xs font-medium text-gray-700">
            Ordenar por precio
          </label>
          <div className="flex items-center">
            <SortToggle value={sortMode} onSortChange={setSortMode} />
          </div>
        </div>

        {/* Filtros por atributos - Horizontal */}
        {filterableAttributes.length > 0 && (
          <div className="flex flex-wrap gap-3 items-end">
            {filterableAttributes.map((attr) => (
              <div key={attr.id} className="flex flex-col min-w-[150px] flex-1 max-w-[200px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {attr.name}
                </label>
                <select
                  value={filters[attr.id] || ''}
                  onChange={(e) => handleFilterChange(attr.id, e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Todos</option>
                  {attr.values.map((value) => (
                    <option key={value.id} value={value.id}>
                      {value.value}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
