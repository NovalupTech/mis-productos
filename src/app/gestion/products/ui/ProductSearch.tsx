"use client"

import { useState, useEffect, useRef } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { IoSearchOutline, IoCloseOutline } from "react-icons/io5";

export function ProductSearch() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMountRef = useRef(true);
  const lastUrlSearchRef = useRef<string>('');
  
  const [search, setSearch] = useState(searchParams.get('search') || '');

  // Inicializar la referencia con el valor inicial
  useEffect(() => {
    lastUrlSearchRef.current = searchParams.get('search') || '';
  }, []);

  // Sincronizar con searchParams cuando cambian externamente (navegación del navegador, etc.)
  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    
    // Solo actualizar si el valor en la URL es diferente al que pusimos nosotros
    if (currentSearch !== lastUrlSearchRef.current && currentSearch !== search) {
      setSearch(currentSearch);
      lastUrlSearchRef.current = currentSearch;
    }
  }, [searchParams, search]);

  // Debounce para actualizar la URL
  useEffect(() => {
    // No ejecutar en el montaje inicial
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    // Limpiar timeout anterior
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Crear nuevo timeout con debounce de 500ms
    debounceTimeoutRef.current = setTimeout(() => {
      const trimmedSearch = search.trim();
      
      // Comparar con el último valor que pusimos en la URL para evitar actualizaciones innecesarias
      if (lastUrlSearchRef.current === trimmedSearch) {
        return; // Ya está actualizado, no hacer nada
      }

      const params = new URLSearchParams(searchParams.toString());
      
      if (trimmedSearch) {
        params.set('search', trimmedSearch);
      } else {
        params.delete('search');
      }
      
      // Resetear página a 1 cuando se busca
      params.set('page', '1');
      
      // Actualizar la referencia antes de cambiar la URL
      lastUrlSearchRef.current = trimmedSearch;
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 500);

    // Limpiar timeout al desmontar
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, pathname, router]); // searchParams removido intencionalmente para evitar ciclo infinito

  const handleClear = () => {
    // Limpiar timeout pendiente
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    setSearch('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    params.set('page', '1');
    
    // Actualizar la referencia antes de cambiar la URL
    lastUrlSearchRef.current = '';
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código o título..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        {search && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Limpiar búsqueda"
          >
            <IoCloseOutline className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

