'use client';

import { createContext, useContext, ReactNode } from 'react';
import { PriceConfig } from '@/utils';

interface PriceConfigContextType {
  priceConfig: PriceConfig;
}

const PriceConfigContext = createContext<PriceConfigContextType | undefined>(undefined);

interface PriceConfigProviderProps {
  children: ReactNode;
  priceConfig: PriceConfig;
}

export const PriceConfigProvider = ({ children, priceConfig }: PriceConfigProviderProps) => {
  return (
    <PriceConfigContext.Provider value={{ priceConfig }}>
      {children}
    </PriceConfigContext.Provider>
  );
};

export const usePriceConfig = (): PriceConfig => {
  const context = useContext(PriceConfigContext);
  if (!context) {
    // Valores por defecto si no hay contexto
    return {
      currency: 'USD',
      format: 'symbol-before',
      showPrices: true,
      enableTax: false,
      taxType: 'percentage',
      taxValue: 0,
    };
  }
  return context.priceConfig;
};
