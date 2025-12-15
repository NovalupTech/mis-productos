'use client';

import { useState } from 'react';
import { createTag, updateTag } from '@/actions';
import { IoCloseOutline } from 'react-icons/io5';
import { Tag } from '@/interfaces';

interface CreateTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tag?: Tag | null;
}

export const CreateTagModal = ({ isOpen, onClose, onSuccess, tag }: CreateTagModalProps) => {
  const [name, setName] = useState(tag?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!tag;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let result;
      
      if (isEditing) {
        result = await updateTag({
          tagId: tag.id,
          name: name.trim(),
        });
      } else {
        result = await createTag({
          name: name.trim(),
        });
      }

      if (result.ok) {
        setName('');
        onSuccess();
        onClose();
      } else {
        setError(result.message || 'Error al guardar el tag');
      }
    } catch (error) {
      setError('Error inesperado al guardar el tag');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName(tag?.name || '');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditing ? 'Editar Tag' : 'Nuevo Tag'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <IoCloseOutline size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Tag
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Oferta, Nuevo, Destacado"
              required
              autoFocus
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
