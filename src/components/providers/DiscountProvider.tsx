'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { getProductDiscounts } from '@/actions/discount/get-product-discounts';
import type { Discount } from '@/utils/discounts';

interface DiscountContextType {
  discounts: Discount[];
  loading: boolean;
}

const DiscountContext = createContext<DiscountContextType>({
  discounts: [],
  loading: true,
});

export const useDiscounts = () => useContext(DiscountContext);

interface DiscountProviderProps {
  children: ReactNode;
}

// Singleton para compartir el estado de carga entre instancias del provider
class DiscountLoader {
  private isLoading = false;
  private promise: Promise<Discount[]> | null = null;
  private subscribers: Set<(discounts: Discount[]) => void> = new Set();

  async load(): Promise<Discount[]> {
    // Si ya hay una llamada en progreso, reutilizar esa promesa
    if (this.isLoading && this.promise) {
      return this.promise;
    }

    // Crear nueva llamada
    this.isLoading = true;
    this.promise = getProductDiscounts();

    try {
      const discounts = await this.promise;
      // Notificar a todos los suscriptores
      this.subscribers.forEach(callback => callback(discounts));
      return discounts;
    } catch (error) {
      console.error('Error loading discounts:', error);
      throw error;
    } finally {
      this.isLoading = false;
      // Limpiar la promesa después de un tiempo para permitir refrescos
      setTimeout(() => {
        this.promise = null;
      }, 5000);
    }
  }

  subscribe(callback: (discounts: Discount[]) => void) {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }
}

const discountLoader = new DiscountLoader();

export const DiscountProvider = ({ children }: DiscountProviderProps) => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    setLoading(true);

    const loadDiscounts = async () => {
      try {
        const loadedDiscounts = await discountLoader.load();
        if (isMountedRef.current) {
          setDiscounts(loadedDiscounts);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading discounts:', error);
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    // Suscribirse a actualizaciones de otros providers
    const unsubscribe = discountLoader.subscribe((loadedDiscounts) => {
      if (isMountedRef.current) {
        setDiscounts(loadedDiscounts);
        setLoading(false);
      }
    });

    loadDiscounts();

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, []);

  return (
    <DiscountContext.Provider value={{ discounts, loading }}>
      {children}
    </DiscountContext.Provider>
  );
};
