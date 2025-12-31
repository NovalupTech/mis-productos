'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { getFavoriteIds } from '@/actions/favorites/get-favorite-ids';
import { useFavoritesStore } from '@/store/favorites/favorites-store';

interface FavoritesContextType {
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType>({
  isLoading: true,
});

export const useFavoritesContext = () => useContext(FavoritesContext);

interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider = ({ children }: FavoritesProviderProps) => {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const { initializeFavorites, clearFavorites, isInitialized } = useFavoritesStore();

  useEffect(() => {
    const loadFavorites = async () => {
      const userId = session?.user?.id;
      
      if (!userId) {
        clearFavorites();
        setIsLoading(false);
        return;
      }

      // Solo cargar si no se ha inicializado
      if (isInitialized) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const favoriteIds = await getFavoriteIds();
        initializeFavorites(favoriteIds);
      } catch (error) {
        console.error('Error loading favorites:', error);
        clearFavorites();
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]); // Solo dependemos del userId, no de las funciones del store

  return (
    <FavoritesContext.Provider value={{ isLoading }}>
      {children}
    </FavoritesContext.Provider>
  );
};
