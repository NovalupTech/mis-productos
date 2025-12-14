'use client';

import { useState, useEffect } from 'react';
import { createSection, updateSection } from '@/actions';
import { IoCloseOutline } from 'react-icons/io5';

interface PageSection {
  id: string;
  type: 'HERO' | 'BANNER' | 'TEXT' | 'IMAGE' | 'FEATURES' | 'GALLERY' | 'CTA';
  position: number;
  enabled: boolean;
  content: Record<string, unknown>;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pageId: string;
  editingSection?: PageSection;
}

const SECTION_TYPES: Array<{ value: PageSection['type']; label: string }> = [
  { value: 'HERO', label: 'Hero' },
  { value: 'BANNER', label: 'Banner' },
  { value: 'TEXT', label: 'Texto' },
  { value: 'IMAGE', label: 'Imagen' },
  { value: 'FEATURES', label: 'Características' },
  { value: 'GALLERY', label: 'Galería' },
  { value: 'CTA', label: 'Llamado a la Acción' },
];

// Configuración de campos por tipo de sección
const SECTION_FIELDS: Record<PageSection['type'], Array<{ key: string; label: string; type: 'text' | 'textarea' | 'url' | 'number' | 'color' }>> = {
  HERO: [
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
    { key: 'image', label: 'URL de Imagen', type: 'url' },
    { key: 'buttonText', label: 'Texto del Botón', type: 'text' },
    { key: 'buttonLink', label: 'Enlace del Botón', type: 'url' },
  ],
  BANNER: [
    { key: 'text', label: 'Texto', type: 'text' },
    { key: 'link', label: 'Enlace', type: 'url' },
    { key: 'backgroundColor', label: 'Color de Fondo', type: 'color' },
    { key: 'textColor', label: 'Color del Texto', type: 'color' },
  ],
  TEXT: [
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'content', label: 'Contenido', type: 'textarea' },
  ],
  IMAGE: [
    { key: 'image', label: 'URL de Imagen', type: 'url' },
    { key: 'alt', label: 'Texto Alternativo', type: 'text' },
    { key: 'caption', label: 'Descripción', type: 'text' },
  ],
  FEATURES: [
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'features', label: 'Características (JSON array)', type: 'textarea' },
  ],
  GALLERY: [
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'images', label: 'URLs de Imágenes (JSON array)', type: 'textarea' },
  ],
  CTA: [
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'description', label: 'Descripción', type: 'textarea' },
    { key: 'buttonText', label: 'Texto del Botón', type: 'text' },
    { key: 'buttonLink', label: 'Enlace del Botón', type: 'url' },
  ],
};

export const SectionFormModal = ({ isOpen, onClose, onSuccess, pageId, editingSection }: Props) => {
  const [formData, setFormData] = useState<{
    type: PageSection['type'];
    enabled: boolean;
    content: Record<string, string>;
  }>({
    type: 'TEXT',
    enabled: true,
    content: {},
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingSection) {
      const content = { ...editingSection.content };
      // Convertir arrays a JSON strings para los campos que lo requieren
      if (editingSection.type === 'FEATURES' && Array.isArray(content.features)) {
        content.features = JSON.stringify(content.features);
      }
      if (editingSection.type === 'GALLERY' && Array.isArray(content.images)) {
        content.images = JSON.stringify(content.images);
      }
      // Asegurar valores por defecto para colores en BANNER
      if (editingSection.type === 'BANNER') {
        if (!content.backgroundColor) content.backgroundColor = '#3B82F6';
        if (!content.textColor) content.textColor = '#FFFFFF';
      }
      
      setFormData({
        type: editingSection.type,
        enabled: editingSection.enabled,
        content: content as Record<string, string>,
      });
    } else {
      setFormData({
        type: 'TEXT',
        enabled: true,
        content: {},
      });
    }
  }, [editingSection, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validar y parsear campos JSON si es necesario
      const processedContent = { ...formData.content };
      
      if (formData.type === 'FEATURES' && processedContent.features) {
        try {
          processedContent.features = JSON.parse(processedContent.features as string);
        } catch {
          setError('El campo "Características" debe ser un JSON válido');
          setLoading(false);
          return;
        }
      }

      if (formData.type === 'GALLERY' && processedContent.images) {
        try {
          processedContent.images = JSON.parse(processedContent.images as string);
        } catch {
          setError('El campo "URLs de Imágenes" debe ser un JSON válido');
          setLoading(false);
          return;
        }
      }

      if (editingSection) {
        const result = await updateSection({
          sectionId: editingSection.id,
          type: formData.type,
          content: processedContent,
          enabled: formData.enabled,
        });
        
        if (result.ok) {
          onSuccess();
        } else {
          setError(result.message || 'Error al actualizar la sección');
        }
      } else {
        const result = await createSection({
          pageId,
          type: formData.type,
          position: 0, // Se calculará automáticamente
          content: processedContent,
          enabled: formData.enabled,
        });
        
        if (result.ok) {
          onSuccess();
        } else {
          setError(result.message || 'Error al crear la sección');
        }
      }
    } catch (err) {
      setError('Error inesperado');
    }
    
    setLoading(false);
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        type: 'TEXT',
        enabled: true,
        content: {},
      });
      setError(null);
      onClose();
    }
  };

  const currentFields = SECTION_FIELDS[formData.type] || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingSection ? 'Editar Sección' : 'Nueva Sección'}
          </h2>
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
                Tipo de Sección
              </label>
              <select
                value={formData.type}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    type: e.target.value as PageSection['type'],
                    content: {}, // Limpiar contenido al cambiar tipo
                  });
                }}
                disabled={loading || !!editingSection}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                {SECTION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {editingSection && (
                <p className="mt-1 text-xs text-gray-500">
                  No se puede cambiar el tipo de una sección existente
                </p>
              )}
            </div>

            {currentFields.map((field) => {
              const value = formData.content[field.key] || (field.type === 'color' ? '#3B82F6' : '');

              return (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          content: { ...formData.content, [field.key]: e.target.value },
                        })
                      }
                      disabled={loading}
                      rows={field.key === 'content' || field.key === 'subtitle' || field.key === 'description' ? 4 : 2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder={`Ingrese ${field.label.toLowerCase()}`}
                    />
                  ) : field.type === 'color' ? (
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            content: { ...formData.content, [field.key]: e.target.value },
                          })
                        }
                        disabled={loading}
                        className="w-16 h-10 border border-gray-300 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            content: { ...formData.content, [field.key]: e.target.value },
                          })
                        }
                        disabled={loading}
                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        placeholder="#3B82F6"
                      />
                    </div>
                  ) : (
                    <input
                      type={field.type}
                      value={value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          content: { ...formData.content, [field.key]: e.target.value },
                        })
                      }
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder={`Ingrese ${field.label.toLowerCase()}`}
                    />
                  )}
                  {(field.key === 'features' || field.key === 'images') && (
                    <p className="mt-1 text-xs text-gray-500">
                      Formato JSON: ["item1", "item2", ...]
                    </p>
                  )}
                </div>
              );
            })}

            <div className="flex items-center gap-2">
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
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : editingSection ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
