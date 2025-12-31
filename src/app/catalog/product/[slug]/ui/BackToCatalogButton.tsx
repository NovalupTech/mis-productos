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
      className="flex items-center gap-2 px-4 py-2 rounded-md transition-colors"
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
      aria-label="Volver al catálogo"
    >
      <IoArrowBack size={20} />
      <span className="text-sm font-medium">Volver al catálogo</span>
    </button>
  );
};
