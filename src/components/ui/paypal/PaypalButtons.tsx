'use client'

import { useState } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js"
import { CreateOrderData, CreateOrderActions, OnApproveActions, OnApproveData } from '@paypal/paypal-js'
import { setTransactionId } from "@/actions/payments/update-order-transactionId";
import { paypalCheckPaymnent } from "@/actions/payments/paypal-check-payment";
import { usePriceConfig } from "@/components/providers/PriceConfigProvider";
import { convertAmountToUSD } from "@/actions/payments/convert-to-usd";
import { getOrderDataForPayment } from "@/actions/orders/get-order-data-for-payment";

interface Props {
  orderId: string;
  amount: number;
}

export const PaypalButtons = ({orderId, amount}: Props) => {

  const [{ isPending }] = usePayPalScriptReducer();
  const priceConfig = usePriceConfig();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const createOrder = async (data: CreateOrderData, actions: CreateOrderActions) => {
    // Obtener datos de la orden (productos y dirección)
    const orderData = await getOrderDataForPayment(orderId);
    
    if (!orderData.ok || !orderData.products || !orderData.address) {
      throw new Error('No se pudieron obtener los datos de la orden');
    }

    const { products, address, subTotal, tax, total } = orderData;
    const currentCurrency = priceConfig.currency || 'USD';

    // Convertir montos a USD
    const conversionResult = await convertAmountToUSD(amount, currentCurrency);
    const usdAmount = conversionResult.ok 
      ? conversionResult.amount 
      : amount;
    const roundedAmount = Math.round((usdAmount) * 100) / 100;

    // Convertir subtotal y tax a USD
    const subTotalUSDResult = await convertAmountToUSD(subTotal, currentCurrency);
    const subTotalUSD = subTotalUSDResult.ok 
      ? subTotalUSDResult.amount 
      : subTotal;
    const roundedSubTotalUSD = Math.round((subTotalUSD) * 100) / 100;

    const taxUSDResult = await convertAmountToUSD(tax, currentCurrency);
    const taxUSD = taxUSDResult.ok 
      ? taxUSDResult.amount 
      : tax;
    const roundedTaxUSD = Math.round((taxUSD) * 100) / 100;

    // Convertir cada item a USD y construir el array de items
    const items = await Promise.all(
      products.map(async (item) => {
        const itemPriceUSD = await convertAmountToUSD(item.price, currentCurrency);
        const itemPrice = itemPriceUSD.ok 
          ? itemPriceUSD.amount 
          : item.price;
        const roundedItemPrice = Math.round((itemPrice) * 100) / 100;

        return {
          name: item.product.title,
          description: item.product.title,
          sku: item.product.slug,
          unit_amount: {
            currency_code: 'USD',
            value: roundedItemPrice.toString(),
          },
          quantity: item.quantity.toString(),
          category: 'PHYSICAL_GOODS' as const,
        };
      })
    );

    // Calcular el total de items para validación
    const itemsTotal = items.reduce((sum, item) => {
      return sum + (parseFloat(item.unit_amount.value) * parseInt(item.quantity));
    }, 0);
    const roundedItemsTotal = Math.round((itemsTotal) * 100) / 100;

    // Construir breakdown con item_total y tax
    // PayPal requiere que item_total + tax = total exactamente
    const calculatedTotal = roundedItemsTotal + roundedTaxUSD;
    const finalTotal = Math.round((calculatedTotal) * 100) / 100;

    const breakdown: {
      item_total: { currency_code: string; value: string };
      tax?: { currency_code: string; value: string };
    } = {
      item_total: {
        currency_code: 'USD',
        value: roundedItemsTotal.toString(),
      },
    };

    // Solo incluir tax si es mayor a 0
    if (roundedTaxUSD > 0) {
      breakdown.tax = {
        currency_code: 'USD',
        value: roundedTaxUSD.toString(),
      };
    }

    const transactionId = await actions.order.create({
      intent: 'CAPTURE',
      application_context: {
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
      purchase_units: [
        {
          invoice_id: orderId,
          amount: {
            value: finalTotal.toString(), // Usar el total calculado para asegurar coincidencia exacta
            currency_code: 'USD',
            breakdown,
          },
          items,
        },
      ],
    });

    const resp = await setTransactionId(orderId, transactionId);
    if(!resp.ok){
      throw new Error('Error setting transactionId');
    }

    return transactionId;
  }

  const onApprove = async (data: OnApproveData, actions: OnApproveActions) => {
    try {
      console.log('onApprove')
      const details = await actions.order?.capture();
      if(!details?.id) {
        return;
      }

      // Solo después de que PayPal haya completado su parte, mostramos el indicador
      setIsProcessingPayment(true);
      
      await paypalCheckPaymnent(details.id);
      // El revalidatePath hará que la página se recargue automáticamente
      // No necesitamos cambiar el estado aquí porque la página se recargará
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      setIsProcessingPayment(false);
    }
  }

  const onError = (err: Record<string, unknown>) => {
    console.error('Error en PayPal:', err);
    setIsProcessingPayment(false);
  }

  if(isPending){
    return (
      <div className="animate-pulse mb-16">
        <div className="h-11 w-full bg-gray-300 rounded"></div>
        <div className="h-11 w-full bg-gray-300 rounded mt-3"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isProcessingPayment && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90 rounded-lg mb-16">
          <div className="flex flex-col items-center justify-center gap-4 p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-800">Procesando pago...</p>
              <p className="text-sm text-gray-600 mt-1">Por favor espera, esto puede tardar unos segundos.</p>
            </div>
          </div>
        </div>
      )}
      <div className="mb-3">
        <p className="text-xs text-gray-600 text-center">
          PayPal procesará el pago en USD
        </p>
      </div>
      <PayPalButtons 
        createOrder={createOrder} 
        onApprove={onApprove}
        onError={onError}
      />
    </div>
  )
}