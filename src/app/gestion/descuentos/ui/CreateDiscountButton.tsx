'use client';

import { useState } from 'react';
import { IoAddOutline } from 'react-icons/io5';
import { CreateDiscountModal } from './CreateDiscountModal';

export const CreateDiscountButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        <IoAddOutline size={20} />
        <span>Nuevo Descuento</span>
      </button>
      <CreateDiscountModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={() => {
          setIsOpen(false);
          window.location.reload();
        }}
      />
    </>
  );
};
