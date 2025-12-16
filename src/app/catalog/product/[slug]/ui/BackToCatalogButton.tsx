'use client';

import { useRouter } from 'next/navigation';
import { IoArrowBack } from 'react-icons/io5';

export const BackToCatalogButton = () => {
  const router = useRouter();

  const handleBackToCatalog = () => {
    router.push('/catalog');
  };

  return (
    <button
      onClick={handleBackToCatalog}
      className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors mb-4"
      aria-label="Volver al catálogo"
    >
      <IoArrowBack size={20} />
      <span className="text-sm font-medium">Volver al catálogo</span>
    </button>
  );
};
