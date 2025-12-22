'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toggleOrderPayment } from '@/actions/orders/toggle-order-payment';
import { IoCheckmarkCircleOutline, IoCloseCircleOutline } from 'react-icons/io5';
import { showErrorToast } from '@/utils/toast';

interface Props {
  orderId: string;
  isPaid: boolean;
}

export const TogglePaymentButton = ({ orderId, isPaid }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setIsLoading(true);
    const result = await toggleOrderPayment(orderId, !isPaid);
    setIsLoading(false);
    
    if (result.ok) {
      router.refresh();
    } else {
      showErrorToast(result.message || 'Error al actualizar el estado de pago');
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        flex items-center gap-1 px-2 py-1 rounded text-sm font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isPaid 
          ? 'text-red-600 hover:text-red-700 hover:bg-red-50' 
          : 'text-green-600 hover:text-green-700 hover:bg-green-50'
        }
      `}
      title={isPaid ? 'Marcar como no pagada' : 'Marcar como pagada'}
    >
      {isPaid ? (
        <>
          <IoCloseCircleOutline size={16} />
          <span>Marcar como No Pagada</span>
        </>
      ) : (
        <>
          <IoCheckmarkCircleOutline size={16} />
          <span>Marcar como Pagada</span>
        </>
      )}
    </button>
  );
};

