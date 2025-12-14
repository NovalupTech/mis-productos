'use client';

import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { IoClose } from 'react-icons/io5';

export const RemoveTagButton = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tag = searchParams.get('tag');

  if (!tag) return null;

  const handleRemoveTag = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('tag');
    const newUrl = params.toString() ? `/catalog?${params.toString()}` : '/catalog';
    router.push(newUrl);
  };

  return (
    <button
      onClick={handleRemoveTag}
      className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-gray-200 transition-colors"
      title="Remover filtro de tag"
    >
      <IoClose size={18} className="text-gray-600" />
    </button>
  );
};
