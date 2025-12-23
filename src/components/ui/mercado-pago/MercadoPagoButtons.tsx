"use client"

import { useState } from "react";
import Image from "next/image";
import { submitPayment } from "@/actions/payments/mercado-pago-check-payments";
import { showErrorToast } from "@/utils/toast";

interface Props {
  orderId: string;
  amount: number;
}

export const MercadoPagoButton = ({orderId, amount}: Props) => {
  const [isLoading, setIsLoading] = useState(false);

  const roundedAmount = Math.round((amount) * 100) / 100;

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      await submitPayment({orderId, roundedAmount});
    } catch (error) {
      console.error('Error al procesar pago con Mercado Pago:', error);
      showErrorToast('Error al procesar el pago. Por favor, intenta nuevamente.');
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handlePayment} 
      disabled={isLoading}
      className="w-full mb-4 h-11 flex-row items-center justify-center flex gap-2 rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" 
      style={{backgroundColor: '#ffe600'}}
    >
       {isLoading ? 'Procesando...' : 
       <Image 
       src="/logo_mp.png" 
       alt="Mercado Pago" 
       width={140} 
       height={140}
       className="object-contain"
     />
       }
    </button>
  )
}