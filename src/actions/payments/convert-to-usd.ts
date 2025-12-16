'use server';

import { convertToUSD } from '@/utils/currencyConversion';

/**
 * Server action para convertir un monto a USD
 * @param amount - Monto a convertir
 * @param fromCurrency - Moneda origen (ej: 'ARS', 'EUR', 'BRL')
 * @returns Monto convertido a USD o el monto original si hay error
 */
export async function convertAmountToUSD(
  amount: number,
  fromCurrency: string
): Promise<{ ok: boolean; amount: number; error?: string }> {
  try {
    const usdAmount = await convertToUSD(amount, fromCurrency);
    
    if (usdAmount === null) {
      return {
        ok: false,
        amount,
        error: 'No se pudo obtener la cotización. Se usará el monto original.',
      };
    }

    return {
      ok: true,
      amount: usdAmount,
    };
  } catch (error) {
    console.error('Error al convertir a USD:', error);
    return {
      ok: false,
      amount,
      error: 'Error al convertir el monto a USD',
    };
  }
}
