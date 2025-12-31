'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';

interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  primaryTextColor: string;
  secondaryTextColor: string;
}

interface ThemeContextType {
  theme: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  primaryColor?: string;
  secondaryColor?: string;
  primaryTextColor?: string;
  secondaryTextColor?: string;
}

export const ThemeProvider = ({ 
  children, 
  primaryColor = '#ffffff', // Blanco por defecto
  secondaryColor = '#2563eb', // Azul eléctrico por defecto (#2563eb = blue-600)
  primaryTextColor = '#1f2937', // Gris oscuro por defecto (gray-800)
  secondaryTextColor = '#ffffff' // Blanco por defecto
}: ThemeProviderProps) => {
  const theme: ThemeConfig = {
    primaryColor,
    secondaryColor,
    primaryTextColor,
    secondaryTextColor,
  };

  // Normalizar colores y calcular hover
  const { normalizedPrimary, normalizedSecondary, normalizedPrimaryText, normalizedSecondaryText, secondaryHover } = useMemo(() => {
    const normPrimary = primaryColor.startsWith('#') ? primaryColor : `#${primaryColor}`;
    const normSecondary = secondaryColor.startsWith('#') ? secondaryColor : `#${secondaryColor}`;
    const normPrimaryText = primaryTextColor.startsWith('#') ? primaryTextColor : `#${primaryTextColor}`;
    const normSecondaryText = secondaryTextColor.startsWith('#') ? secondaryTextColor : `#${secondaryTextColor}`;
    const hover = adjustBrightness(normSecondary, -15);
    
    return {
      normalizedPrimary: normPrimary,
      normalizedSecondary: normSecondary,
      normalizedPrimaryText: normPrimaryText,
      normalizedSecondaryText: normSecondaryText,
      secondaryHover: hover,
    };
  }, [primaryColor, secondaryColor, primaryTextColor, secondaryTextColor]);

  return (
    <ThemeContext.Provider value={{ theme }}>
      <style dangerouslySetInnerHTML={{
        __html: `
          :root {
            --theme-primary-color: ${normalizedPrimary};
            --theme-secondary-color: ${normalizedSecondary};
            --theme-secondary-color-hover: ${secondaryHover};
            --theme-primary-text-color: ${normalizedPrimaryText};
            --theme-secondary-text-color: ${normalizedSecondaryText};
          }
        `
      }} />
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Ajusta el brillo de un color hexadecimal (oscurece o aclara)
 */
function adjustBrightness(hex: string, percent: number): string {
  // Remover el # si existe
  let cleanHex = hex.replace('#', '');
  
  // Si es un color de 3 dígitos, expandirlo a 6
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }
  
  // Convertir a número
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) {
    // Si no es válido, retornar el color original
    return hex.startsWith('#') ? hex : `#${hex}`;
  }
  
  // Extraer RGB
  const r = (num >> 16) & 0xFF;
  const g = (num >> 8) & 0xFF;
  const b = num & 0xFF;
  
  // Ajustar brillo (percent puede ser negativo para oscurecer)
  const factor = 1 + (percent / 100);
  const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
  const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
  const newB = Math.min(255, Math.max(0, Math.round(b * factor)));
  
  // Convertir de vuelta a hexadecimal
  const newHex = ((newR << 16) | (newG << 8) | newB).toString(16).padStart(6, '0');
  return `#${newHex}`;
}
