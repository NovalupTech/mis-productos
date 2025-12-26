/**
 * Configuración de monedas disponibles
 */
export const CURRENCIES = [
  { value: 'USD', label: 'USD - Dólar estadounidense', symbol: '$' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { value: 'ARS', label: 'ARS - Peso argentino', symbol: '$' },
  { value: 'MXN', label: 'MXN - Peso mexicano', symbol: '$' },
  { value: 'CLP', label: 'CLP - Peso chileno', symbol: '$' },
  { value: 'COP', label: 'COP - Peso colombiano', symbol: '$' },
  { value: 'BRL', label: 'BRL - Real brasileño', symbol: 'R$' },
  { value: 'PEN', label: 'PEN - Sol peruano', symbol: 'S/' },
] as const;

/**
 * Valores por defecto para la configuración de precios
 */
export const DEFAULT_CURRENCY = 'USD';
export const DEFAULT_FORMAT = 'symbol-before';
export const DEFAULT_SHOW_PRICES = true;
export const DEFAULT_DECIMALS = 2;

/**
 * Interfaz para la configuración de precios
 */
export interface PriceConfig {
  currency?: string;
  format?: string;
  showPrices?: boolean;
  decimals?: number;
  enableTax?: boolean;
  taxType?: 'percentage' | 'fixed';
  taxValue?: number;
}

/**
 * Formatea un número con separador de miles (punto) y decimales (coma)
 * @param value - El valor numérico
 * @param decimals - Cantidad de decimales
 * @returns El número formateado como string (ej: "50.000,50")
 */
const formatNumber = (value: number, decimals: number): string => {
  // Redondear el valor según los decimales configurados
  const multiplier = Math.pow(10, decimals);
  const roundedValue = Math.round(value * multiplier) / multiplier;
  
  // Separar parte entera y decimal
  const parts = roundedValue.toFixed(decimals).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1] || '';
  
  // Agregar separador de miles (punto) a la parte entera
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Si hay decimales, agregarlos con coma, sino solo retornar la parte entera
  if (decimals > 0 && decimalPart) {
    return `${formattedInteger},${decimalPart}`;
  }
  
  return formattedInteger;
};

/**
 * Formatea un precio según la configuración de la empresa
 * @param value - El valor numérico del precio
 * @param config - La configuración de precios (currency, format, showPrices)
 * @returns El precio formateado como string, o null si showPrices es false
 */
export const formatPrice = (value: number, config?: PriceConfig): string | null => {
  // Si showPrices es false, retornar null
  if (config?.showPrices === false) {
    return null;
  }

  // Obtener la cantidad de decimales de la configuración o usar el valor por defecto
  const decimals = config?.decimals !== undefined ? config.decimals : DEFAULT_DECIMALS;
  
  // Formatear el número con separador de miles (punto) y decimales (coma)
  const formattedValue = formatNumber(value, decimals);

  // Usar valores por defecto si no hay configuración
  const currency = config?.currency || DEFAULT_CURRENCY;
  const format = config?.format || DEFAULT_FORMAT;

  // Buscar el símbolo de la moneda
  const currencyInfo = CURRENCIES.find(c => c.value === currency);
  const symbol = currencyInfo?.symbol || '$';

  // Formatear según el formato seleccionado
  switch (format) {
    case 'symbol-before':
      return `${symbol}${formattedValue}`;
    case 'symbol-after':
      return `${formattedValue}${symbol}`;
    case 'code-before':
      return `${currency} ${formattedValue}`;
    case 'code-after':
      return `${formattedValue} ${currency}`;
    default:
      return `${symbol}${formattedValue}`;
  }
};

/**
 * Obtiene la configuración de precios desde un objeto de configuraciones
 * @param configs - Objeto con todas las configuraciones de la empresa
 * @returns Objeto con la configuración de precios
 */
export const getPriceConfig = (configs: Record<string, any>): PriceConfig => {
  return {
    currency: configs['prices.currency'] || DEFAULT_CURRENCY,
    format: configs['prices.format'] || DEFAULT_FORMAT,
    showPrices: configs['prices.showPrices'] !== undefined 
      ? configs['prices.showPrices'] 
      : DEFAULT_SHOW_PRICES,
    decimals: configs['prices.decimals'] !== undefined 
      ? Number(configs['prices.decimals']) 
      : DEFAULT_DECIMALS,
    enableTax: configs['prices.enableTax'] !== undefined 
      ? configs['prices.enableTax'] 
      : false,
    taxType: configs['prices.taxType'] || 'percentage',
    taxValue: configs['prices.taxValue'] !== undefined 
      ? Number(configs['prices.taxValue']) 
      : 0,
  };
};
