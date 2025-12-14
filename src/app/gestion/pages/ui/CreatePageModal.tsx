'use client';

import { useState } from 'react';
import { createPage } from '@/actions/page/create-page';
import { IoCloseOutline } from 'react-icons/io5';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreatePageModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const [formData, setFormData] = useState({
    type: 'INFO' as 'HOME' | 'CATALOG' | 'INFO',
    slug: '',
    title: '',
    enabled: true,
    isLanding: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createPage(formData);
    
    if (result.ok) {
      setFormData({
        type: 'INFO',
        slug: '',
        title: '',
        enabled: true,
        isLanding: false,
      });
      onSuccess();
      onClose();
    } else {
      setError(result.message || 'Error al crear la página');
    }
    
    setLoading(false);
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        type: 'INFO',
        slug: '',
        title: '',
        enabled: true,
        isLanding: false,
      });
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Crear Nueva Página</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <IoCloseOutline size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Página
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as 'HOME' | 'CATALOG' | 'INFO' })
                }
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="INFO">INFO</option>
                <option value="HOME">HOME</option>
                <option value="CATALOG">CATALOG</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Nota: Solo puede haber una página de cada tipo por compañía. Si ya existe una página de este tipo, no podrás crear otra.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={loading}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="Ej: Sobre Nosotros"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug (URL)
              </label>
              <input
                type="text"
                value={formData.type === 'CATALOG' ? 'catalog' : formData.slug}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                  })
                }
                disabled={loading || formData.type === 'CATALOG'}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="Ej: sobre-nosotros"
              />
              {formData.type === 'CATALOG' && (
                <p className="mt-1 text-xs text-gray-500">
                  El slug de CATALOG se establece automáticamente como "catalog"
                </p>
              )}
              {formData.type !== 'CATALOG' && (
                <p className="mt-1 text-xs text-gray-500">
                  Solo letras minúsculas, números y guiones. Se usará en la URL: /{formData.slug || 'slug'}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  disabled={loading}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Habilitada</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isLanding}
                  onChange={(e) => setFormData({ ...formData, isLanding: e.target.checked })}
                  disabled={loading}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Marcar como Landing</span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title || (formData.type !== 'CATALOG' && !formData.slug)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Página'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
