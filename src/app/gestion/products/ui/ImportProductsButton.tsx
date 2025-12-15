'use client';

import { useState } from 'react';
import { IoCloudUploadOutline } from 'react-icons/io5';
import { ImportProductsModal } from './ImportProductsModal';

export const ImportProductsButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn-primary flex items-center gap-2"
      >
        <IoCloudUploadOutline size={20} />
        Importar productos Excel
      </button>

      {isModalOpen && (
        <ImportProductsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};
