'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

export const DiscountProvider = ({ children }: DiscountProviderProps) => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDiscounts = async () => {
      try {
        const loadedDiscounts = await getProductDiscounts();
        setDiscounts(loadedDiscounts);
      } catch (error) {
        console.error('Error loading discounts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDiscounts();
  }, []);

  return (
    <DiscountContext.Provider value={{ discounts, loading }}>
      {children}
    </DiscountContext.Provider>
  );
};
