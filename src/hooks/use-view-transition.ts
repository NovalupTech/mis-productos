'use client';

import { useRouter } from 'next/navigation';
import { startTransition } from 'react';

/**
 * Hook personalizado para manejar View Transitions API
 * Permite animaciones suaves entre páginas cuando el navegador lo soporta
 */
export const useViewTransition = () => {
  const router = useRouter();

  const navigateWithTransition = (url: string) => {
    // Verificar si el navegador soporta View Transitions API
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      // @ts-ignore - startViewTransition puede no estar en los tipos de TypeScript aún
      const transition = document.startViewTransition(() => {
        router.push(url);
      });
      
      // Esperar a que la transición esté lista
      transition.ready.then(() => {
        // La transición está lista, no necesitamos hacer nada adicional
      });
    } else {
      // Fallback para navegadores que no soportan View Transitions
      router.push(url);
    }
  };

  return { navigateWithTransition };
};



















