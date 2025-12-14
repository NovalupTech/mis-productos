'use client';

import Link from 'next/link';

export const CheckoutButton = () => {
  return (
    <Link 
      className="flex justify-center mt-5 mb-2 w-full text-white py-2 px-4 rounded transition-all font-medium"
      style={{
        backgroundColor: 'var(--theme-secondary-color)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--theme-secondary-color-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--theme-secondary-color)';
      }}
      href={'/checkout/address'}
    >
      Checkout
    </Link>
  );
};
