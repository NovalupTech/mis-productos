/**
 * Obtiene las tasas de cambio desde Coinbase API
 */
export interface CoinbaseExchangeRates {
  data: {
    currency: string;
    rates: Record<string, string>;
  };
}

/**
 * Obtiene las tasas de cambio desde Coinbase
 */
export async function getExchangeRates(): Promise<CoinbaseExchangeRates | null> {
  try {
    const response = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD', {
      cache: 'no-store', // Siempre obtener la cotización más reciente
    });

    if (!response.ok) {
      throw new Error(`Error al obtener cotización: ${response.statusText}`);
    }

    const data: CoinbaseExchangeRates = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener cotización de Coinbase:', error);
    return null;
  }
}

/**
 * Convierte un monto de una moneda a USD usando las tasas de Coinbase
 * @param amount - Monto a convertir
 * @param fromCurrency - Moneda origen (ej: 'ARS', 'EUR', 'BRL')
 * @returns Monto convertido a USD, o null si hay error
 */
export async function convertToUSD(
  amount: number,
  fromCurrency: string
): Promise<number | null> {
  // Si ya es USD, no hay conversión necesaria
  if (fromCurrency === 'USD') {
    return amount;
  }

  const exchangeRates = await getExchangeRates();
  if (!exchangeRates) {
    return null;
  }

  const rate = exchangeRates.data.rates[fromCurrency];
  if (!rate) {
    console.error(`No se encontró tasa de cambio para ${fromCurrency}`);
    return null;
  }

  const rateNumber = parseFloat(rate);
  if (isNaN(rateNumber) || rateNumber <= 0) {
    console.error(`Tasa de cambio inválida para ${fromCurrency}: ${rate}`);
    return null;
  }

  // La tasa de Coinbase es: 1 USD = X [fromCurrency]
  // Entonces: amount [fromCurrency] / rate = amount [USD]
  const usdAmount = amount / rateNumber;
  
  // Redondear a 2 decimales
  return Math.round(usdAmount * 100) / 100;
}
