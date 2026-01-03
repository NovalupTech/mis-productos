'use client';

import { useState, useEffect, useRef } from 'react';
import { createSection, updateSection, uploadPageImage } from '@/actions';
import { IoCloseOutline, IoCloudUploadOutline, IoImageOutline } from 'react-icons/io5';
import Image from 'next/image';
import { showErrorToast } from '@/utils/toast';
import clsx from 'clsx';

interface PageSection {
  id: string;
  type: 'HERO' | 'BANNER' | 'TEXT' | 'IMAGE' | 'FEATURES' | 'GALLERY' | 'CTA' | 'MAP';
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
  { value: 'MAP', label: 'Mapa' },
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
  MAP: [
    { key: 'title', label: 'Título (opcional)', type: 'text' },
    { key: 'address', label: 'Dirección (opcional, usa la de la empresa si está vacío)', type: 'textarea' },
    { key: 'width', label: 'Ancho (ej: 100%, 800px)', type: 'text' },
    { key: 'height', label: 'Alto (ej: 400px, 600px)', type: 'text' },
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
  const [imageUploadMode, setImageUploadMode] = useState<'url' | 'upload'>('url');
  const [galleryUploadMode, setGalleryUploadMode] = useState<'url' | 'upload'>('url');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingSection) {
      const content = { ...editingSection.content };
      // Convertir arrays a JSON strings para los campos que lo requieren
      if (editingSection.type === 'FEATURES' && Array.isArray(content.features)) {
        content.features = JSON.stringify(content.features);
      }
      if (editingSection.type === 'GALLERY' && Array.isArray(content.images)) {
        // Convertir array a string separado por comas para mejor UX
        content.images = (content.images as string[]).join(', ');
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
      
      // Establecer el modo de imagen según si ya hay una imagen
      if ((editingSection.type === 'HERO' || editingSection.type === 'IMAGE') && content.image) {
        setImageUploadMode('url');
      }
      // Establecer el modo de galería según si ya hay imágenes
      if (editingSection.type === 'GALLERY' && content.images) {
        setGalleryUploadMode('url');
      }
    } else {
      setFormData({
        type: 'TEXT',
        enabled: true,
        content: {},
      });
      setImageUploadMode('url');
      setGalleryUploadMode('url');
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
          // Intentar parsear como JSON primero
          processedContent.images = JSON.parse(processedContent.images as string);
        } catch {
          // Si no es JSON válido, intentar como URLs separadas por coma
          const urlsString = processedContent.images as string;
          const urlsArray = urlsString
            .split(',')
            .map(url => url.trim())
            .filter(Boolean);
          
          if (urlsArray.length === 0) {
            setError('Debes ingresar al menos una URL de imagen');
            setLoading(false);
            return;
          }
          
          processedContent.images = urlsArray;
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
      setImageUploadMode('url');
      setGalleryUploadMode('url');
      onClose();
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showErrorToast('El archivo debe ser una imagen');
      return;
    }

    setUploadingImage(true);
    try {
      const result = await uploadPageImage(file);
      if (result.ok && result.url) {
        setFormData({
          ...formData,
          content: { ...formData.content, image: result.url },
        });
        setImageUploadMode('url');
      } else {
        showErrorToast(result.message || 'Error al subir la imagen');
      }
    } catch (err) {
      showErrorToast('Error al subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleGalleryImagesUpload = async (files: FileList) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      showErrorToast('Debes seleccionar al menos una imagen');
      return;
    }

    setUploadingGallery(true);
    try {
      const uploadPromises = imageFiles.map(file => uploadPageImage(file));
      const results = await Promise.all(uploadPromises);
      
      const uploadedUrls = results
        .filter(result => result.ok && result.url)
        .map(result => result.url!);
      
      if (uploadedUrls.length === 0) {
        showErrorToast('No se pudieron subir las imágenes');
        return;
      }

      // Obtener las URLs existentes
      const currentImages = formData.content.images || '';
      let existingUrls: string[] = [];
      
      if (currentImages) {
        // Intentar parsear como JSON primero
        try {
          existingUrls = JSON.parse(currentImages);
        } catch {
          // Si no es JSON, intentar como URLs separadas por coma
          existingUrls = currentImages.split(',').map(url => url.trim()).filter(Boolean);
        }
      }

      // Combinar URLs existentes con las nuevas
      const allUrls = [...existingUrls, ...uploadedUrls];
      
      setFormData({
        ...formData,
        content: { ...formData.content, images: JSON.stringify(allUrls) },
      });
      
      setGalleryUploadMode('url');
    } catch (err) {
      showErrorToast('Error al subir las imágenes');
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleGalleryImagesUpload(files);
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
                  setImageUploadMode('url'); // Resetear modo de imagen al cambiar tipo
                  setGalleryUploadMode('url'); // Resetear modo de galería al cambiar tipo
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
              const isImageField = (formData.type === 'HERO' || formData.type === 'IMAGE') && field.key === 'image';
              const isGalleryField = formData.type === 'GALLERY' && field.key === 'images';

              return (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  
                  {isImageField ? (
                    <div className="space-y-3">
                      {/* Selector de modo */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setImageUploadMode('url')}
                          disabled={loading || uploadingImage}
                          className={clsx(
                            'flex-1 px-3 py-2 text-sm border rounded-md transition-colors',
                            imageUploadMode === 'url'
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          )}
                        >
                          <IoImageOutline className="inline mr-2" size={16} />
                          Usar URL
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setImageUploadMode('upload');
                            fileInputRef.current?.click();
                          }}
                          disabled={loading || uploadingImage}
                          className={clsx(
                            'flex-1 px-3 py-2 text-sm border rounded-md transition-colors',
                            imageUploadMode === 'upload'
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          )}
                        >
                          <IoCloudUploadOutline className="inline mr-2" size={16} />
                          Subir Imagen
                        </button>
                      </div>

                      {/* Input de URL */}
                      {imageUploadMode === 'url' && (
                        <div>
                          <input
                            type="url"
                            value={value}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                content: { ...formData.content, [field.key]: e.target.value },
                              })
                            }
                            disabled={loading || uploadingImage}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            placeholder="https://ejemplo.com/imagen.jpg"
                          />
                        </div>
                      )}

                      {/* Input de archivo */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={loading || uploadingImage}
                        className="hidden"
                      />

                      {/* Preview de imagen */}
                      {value && (
                        <div className="relative w-full h-48 border border-gray-300 rounded-md overflow-hidden bg-gray-50">
                          <Image
                            src={value}
                            alt="Preview"
                            fill
                            className="object-contain"
                            onError={() => {
                              // Si la imagen no se puede cargar, no hacer nada
                            }}
                          />
                        </div>
                      )}

                      {uploadingImage && (
                        <p className="text-sm text-blue-600">Subiendo imagen...</p>
                      )}
                    </div>
                  ) : isGalleryField ? (
                    <div className="space-y-3">
                      {/* Selector de modo */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setGalleryUploadMode('url')}
                          disabled={loading || uploadingGallery}
                          className={clsx(
                            'flex-1 px-3 py-2 text-sm border rounded-md transition-colors',
                            galleryUploadMode === 'url'
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          )}
                        >
                          <IoImageOutline className="inline mr-2" size={16} />
                          Usar URLs
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setGalleryUploadMode('upload');
                            galleryFileInputRef.current?.click();
                          }}
                          disabled={loading || uploadingGallery}
                          className={clsx(
                            'flex-1 px-3 py-2 text-sm border rounded-md transition-colors',
                            galleryUploadMode === 'upload'
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          )}
                        >
                          <IoCloudUploadOutline className="inline mr-2" size={16} />
                          Subir Imágenes
                        </button>
                      </div>

                      {/* Input de URLs separadas por coma */}
                      {galleryUploadMode === 'url' && (
                        <div>
                          <textarea
                            value={value}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                content: { ...formData.content, [field.key]: e.target.value },
                              })
                            }
                            disabled={loading || uploadingGallery}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            placeholder="https://ejemplo.com/imagen1.jpg, https://ejemplo.com/imagen2.jpg, https://ejemplo.com/imagen3.jpg"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Ingresa las URLs separadas por coma
                          </p>
                        </div>
                      )}

                      {/* Input de archivos múltiples */}
                      <input
                        ref={galleryFileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryFileChange}
                        disabled={loading || uploadingGallery}
                        className="hidden"
                      />

                      {/* Preview de imágenes */}
                      {value && (() => {
                        let imageUrls: string[] = [];
                        try {
                          imageUrls = JSON.parse(value);
                        } catch {
                          // Si no es JSON, intentar como URLs separadas por coma
                          imageUrls = value.split(',').map(url => url.trim()).filter(Boolean);
                        }
                        
                        return imageUrls.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {imageUrls.map((url, index) => (
                              <div
                                key={index}
                                className="relative w-full aspect-square border border-gray-300 rounded-md overflow-hidden bg-gray-50"
                              >
                                <Image
                                  src={url}
                                  alt={`Preview ${index + 1}`}
                                  fill
                                  className="object-cover"
                                  onError={() => {
                                    // Si la imagen no se puede cargar, no hacer nada
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedUrls = imageUrls.filter((_, i) => i !== index);
                                    setFormData({
                                      ...formData,
                                      content: {
                                        ...formData.content,
                                        [field.key]: updatedUrls.length > 0 ? JSON.stringify(updatedUrls) : '',
                                      },
                                    });
                                  }}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                  title="Eliminar imagen"
                                >
                                  <IoCloseOutline size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : null;
                      })()}

                      {uploadingGallery && (
                        <p className="text-sm text-blue-600">Subiendo imágenes...</p>
                      )}
                    </div>
                  ) : field.type === 'textarea' ? (
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
                  {field.key === 'features' && (
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
