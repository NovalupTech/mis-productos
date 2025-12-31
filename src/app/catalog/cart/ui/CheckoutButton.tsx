'use client';

import Link from 'next/link';

interface CheckoutButtonProps {
  handlesShipping: boolean;
}

export const CheckoutButton = ({ handlesShipping }: CheckoutButtonProps) => {
  // Si no se manejan envíos, redirigir directamente a checkout
  const checkoutUrl = handlesShipping ? '/catalog/checkout/address' : '/catalog/checkout';

  return (
    <Link 
      className="flex justify-center mt-5 mb-2 w-full py-2 px-4 rounded transition-all font-medium"
      style={{
        backgroundColor: 'var(--theme-secondary-color)',
        color: 'var(--theme-secondary-text-color)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--theme-secondary-color-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--theme-secondary-color)';
      }}
      href={checkoutUrl}
    >
      Checkout
    </Link>
  );
};
