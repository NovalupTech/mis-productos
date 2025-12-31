import { create } from "zustand";

interface FavoritesState {
  favoriteIds: Set<string>;
  isLoading: boolean;
  isInitialized: boolean;
  setFavoriteIds: (ids: string[]) => void;
  addFavorite: (productId: string) => void;
  removeFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  initializeFavorites: (ids: string[]) => void;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favoriteIds: new Set<string>(),
  isLoading: false,
  isInitialized: false,

  setFavoriteIds: (ids: string[]) => {
    set({ favoriteIds: new Set(ids), isInitialized: true });
  },

  addFavorite: (productId: string) => {
    const { favoriteIds } = get();
    const newSet = new Set(favoriteIds);
    newSet.add(productId);
    set({ favoriteIds: newSet });
  },

  removeFavorite: (productId: string) => {
    const { favoriteIds } = get();
    const newSet = new Set(favoriteIds);
    newSet.delete(productId);
    set({ favoriteIds: newSet });
  },

  isFavorite: (productId: string) => {
    const { favoriteIds } = get();
    return favoriteIds.has(productId);
  },

  initializeFavorites: (ids: string[]) => {
    set({ favoriteIds: new Set(ids), isInitialized: true, isLoading: false });
  },

  clearFavorites: () => {
    set({ favoriteIds: new Set<string>(), isInitialized: false });
  },
}));
