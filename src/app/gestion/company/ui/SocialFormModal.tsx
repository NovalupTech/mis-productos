'use client';

import { useState, useEffect } from 'react';
import {
  createCompanySocial,
  updateCompanySocial,
} from '@/actions';
import { IoCloseOutline } from 'react-icons/io5';
import { FaInstagram, FaFacebook, FaTiktok, FaTwitter, FaLinkedin, FaYoutube, FaWhatsapp, FaGlobe } from 'react-icons/fa';
import { SocialType } from '@prisma/client';

interface CompanySocial {
  id: string;
  type: SocialType;
  url: string;
  label: string | null;
  enabled: boolean;
  order: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingSocial: CompanySocial | null;
}

const SOCIAL_TYPE_ICONS: Record<SocialType, React.ComponentType<{ size?: number; className?: string }>> = {
  INSTAGRAM: FaInstagram,
  FACEBOOK: FaFacebook,
  TIKTOK: FaTiktok,
  X: FaTwitter,
  LINKEDIN: FaLinkedin,
  YOUTUBE: FaYoutube,
  WHATSAPP: FaWhatsapp,
  WEBSITE: FaGlobe,
};

const SOCIAL_TYPES: Array<{ value: SocialType; label: string }> = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'X', label: 'X (Twitter)' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'WEBSITE', label: 'Sitio Web' },
];

export const SocialFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  editingSocial,
}: Props) => {
  const [formData, setFormData] = useState({
    type: 'INSTAGRAM' as SocialType,
    url: '',
    label: '',
    enabled: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingSocial) {
      setFormData({
        type: editingSocial.type,
        url: editingSocial.url,
        label: editingSocial.label || '',
        enabled: editingSocial.enabled,
      });
    } else {
      setFormData({
        type: 'INSTAGRAM',
        url: '',
        label: '',
        enabled: true,
      });
    }
    setError(null);
  }, [editingSocial, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editingSocial) {
        const result = await updateCompanySocial({
          socialId: editingSocial.id,
          ...formData,
        });
        if (result.ok) {
          onSuccess();
        } else {
          setError(result.message);
        }
      } else {
        const result = await createCompanySocial(formData);
        if (result.ok) {
          onSuccess();
        } else {
          setError(result.message);
        }
      }
    } catch (err) {
      setError('Error al guardar la red social');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingSocial ? 'Editar Red Social' : 'Agregar Red Social'}
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <IoCloseOutline size={24} />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Red Social *
            </label>
            <div className="relative">
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as SocialType })
                }
                disabled={loading || !!editingSocial}
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 appearance-none"
              >
                {SOCIAL_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {(() => {
                  const Icon = SOCIAL_TYPE_ICONS[formData.type];
                  return <Icon size={18} className="text-gray-500" />;
                })()}
              </div>
            </div>
            {editingSocial && (
              <p className="mt-1 text-xs text-gray-500">
                El tipo de red social no puede ser modificado
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL *
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              required
              disabled={loading}
              placeholder="https://instagram.com/miempresa"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Etiqueta (opcional)
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) =>
                setFormData({ ...formData, label: e.target.value })
              }
              disabled={loading}
              placeholder="Ej: @miempresa o Mi Empresa"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              Texto que se mostrará junto al enlace (opcional)
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={(e) =>
                setFormData({ ...formData, enabled: e.target.checked })
              }
              disabled={loading}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="enabled"
              className="ml-2 text-sm text-gray-700"
            >
              Habilitada
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.url}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading
                ? 'Guardando...'
                : editingSocial
                ? 'Actualizar'
                : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
