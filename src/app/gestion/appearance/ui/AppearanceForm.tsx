'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateCompanyConfig, deleteCompanyConfig } from '@/actions';
import { IoColorPaletteOutline, IoGridOutline, IoImageOutline, IoRefreshOutline } from 'react-icons/io5';

interface AppearanceFormProps {
  initialConfig: Record<string, any>;
}

const IMAGE_SIZES = [
  { value: 'small', label: 'Pequeño' },
  { value: 'medium', label: 'Mediano' },
  { value: 'large', label: 'Grande' },
];

const COLUMN_OPTIONS = [
  { value: 2, label: '2 columnas' },
  { value: 3, label: '3 columnas' },
  { value: 4, label: '4 columnas' },
  { value: 5, label: '5 columnas' },
  { value: 6, label: '6 columnas' },
];

// Valores por defecto
const DEFAULT_PRIMARY_COLOR = '#ffffff';
const DEFAULT_SECONDARY_COLOR = '#2563eb';
const DEFAULT_PRIMARY_TEXT_COLOR = '#1f2937';
const DEFAULT_SECONDARY_TEXT_COLOR = '#ffffff';
const DEFAULT_COLUMNS = 4;
const DEFAULT_IMAGE_SIZE = 'medium';

export const AppearanceForm = ({ initialConfig }: AppearanceFormProps) => {
  const router = useRouter();
  const [primaryColor, setPrimaryColor] = useState<string>(
    initialConfig['theme.primaryColor'] || DEFAULT_PRIMARY_COLOR
  );
  const [secondaryColor, setSecondaryColor] = useState<string>(
    initialConfig['theme.secondaryColor'] || DEFAULT_SECONDARY_COLOR
  );
  const [primaryTextColor, setPrimaryTextColor] = useState<string>(
    initialConfig['theme.primaryTextColor'] || DEFAULT_PRIMARY_TEXT_COLOR
  );
  const [secondaryTextColor, setSecondaryTextColor] = useState<string>(
    initialConfig['theme.secondaryTextColor'] || DEFAULT_SECONDARY_TEXT_COLOR
  );
  const [catalogColumns, setCatalogColumns] = useState<number>(
    initialConfig['catalog.columns'] || DEFAULT_COLUMNS
  );
  const [imageSize, setImageSize] = useState<string>(
    initialConfig['catalog.imageSize'] || DEFAULT_IMAGE_SIZE
  );
  const [loading, setLoading] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Verificar si cada configuración existe (no es default)
  const hasPrimaryColor = !!initialConfig['theme.primaryColor'];
  const hasSecondaryColor = !!initialConfig['theme.secondaryColor'];
  const hasPrimaryTextColor = !!initialConfig['theme.primaryTextColor'];
  const hasSecondaryTextColor = !!initialConfig['theme.secondaryTextColor'];
  const hasCatalogColumns = initialConfig['catalog.columns'] !== undefined;
  const hasImageSize = initialConfig['catalog.imageSize'] !== undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const result = await updateCompanyConfig([
        { key: 'theme.primaryColor', value: primaryColor },
        { key: 'theme.secondaryColor', value: secondaryColor },
        { key: 'theme.primaryTextColor', value: primaryTextColor },
        { key: 'theme.secondaryTextColor', value: secondaryTextColor },
        { key: 'catalog.columns', value: catalogColumns },
        { key: 'catalog.imageSize', value: imageSize },
      ]);

      if (result.ok) {
        setMessage({ type: 'success', text: result.message || 'Configuración actualizada' });
        router.refresh();
      } else {
        setMessage({ type: 'error', text: result.message || 'Error al actualizar' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Error al guardar los cambios' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefault = async (key: string) => {
    setDeletingKey(key);
    setMessage(null);

    try {
      const result = await deleteCompanyConfig(key);

      if (result.ok) {
        // Restaurar valores por defecto en el estado local
        if (key === 'theme.primaryColor') {
          setPrimaryColor(DEFAULT_PRIMARY_COLOR);
        } else if (key === 'theme.secondaryColor') {
          setSecondaryColor(DEFAULT_SECONDARY_COLOR);
        } else if (key === 'catalog.columns') {
          setCatalogColumns(DEFAULT_COLUMNS);
        } else if (key === 'theme.primaryTextColor') {
          setPrimaryTextColor(DEFAULT_PRIMARY_TEXT_COLOR);
        } else if (key === 'theme.secondaryTextColor') {
          setSecondaryTextColor(DEFAULT_SECONDARY_TEXT_COLOR);
        } else if (key === 'catalog.imageSize') {
          setImageSize(DEFAULT_IMAGE_SIZE);
        }

        setMessage({ type: 'success', text: result.message || 'Configuración restaurada al valor por defecto' });
        router.refresh();
      } else {
        setMessage({ type: 'error', text: result.message || 'Error al restaurar' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Error al restaurar la configuración' });
    } finally {
      setDeletingKey(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl">
      {/* Sección de colores */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <IoColorPaletteOutline size={24} className="text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Colores del tema</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:p-6">
          {/* Color primario */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Color primario
                <span className="text-xs text-gray-500 ml-2">(Fondos y elementos destacados)</span>
              </label>
              {hasPrimaryColor && (
                <button
                  type="button"
                  onClick={() => handleResetToDefault('theme.primaryColor')}
                  disabled={deletingKey === 'theme.primaryColor'}
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Restaurar al valor por defecto"
                >
                  <IoRefreshOutline size={14} />
                  <span>Default</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder={DEFAULT_PRIMARY_COLOR}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Color secundario */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Color secundario
                <span className="text-xs text-gray-500 ml-2">(Botones y acciones)</span>
              </label>
              {hasSecondaryColor && (
                <button
                  type="button"
                  onClick={() => handleResetToDefault('theme.secondaryColor')}
                  disabled={deletingKey === 'theme.secondaryColor'}
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Restaurar al valor por defecto"
                >
                  <IoRefreshOutline size={14} />
                  <span>Default</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                placeholder={DEFAULT_SECONDARY_COLOR}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Color de texto primario */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Color de texto primario
                <span className="text-xs text-gray-500 ml-2">(Texto en las páginas)</span>
              </label>
              {hasPrimaryTextColor && (
                <button
                  type="button"
                  onClick={() => handleResetToDefault('theme.primaryTextColor')}
                  disabled={deletingKey === 'theme.primaryTextColor'}
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Restaurar al valor por defecto"
                >
                  <IoRefreshOutline size={14} />
                  <span>Default</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryTextColor}
                onChange={(e) => setPrimaryTextColor(e.target.value)}
                className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={primaryTextColor}
                onChange={(e) => setPrimaryTextColor(e.target.value)}
                placeholder={DEFAULT_PRIMARY_TEXT_COLOR}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {/* Preview */}
            <div className="mt-3 p-4 rounded-lg" style={{ backgroundColor: primaryColor }}>
              <p className="font-medium text-center" style={{ color: primaryTextColor }}>
                Vista previa del texto
              </p>
            </div>
          </div>

          {/* Color de texto secundario */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Color de texto secundario
                <span className="text-xs text-gray-500 ml-2">(Texto en los botones)</span>
              </label>
              {hasSecondaryTextColor && (
                <button
                  type="button"
                  onClick={() => handleResetToDefault('theme.secondaryTextColor')}
                  disabled={deletingKey === 'theme.secondaryTextColor'}
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Restaurar al valor por defecto"
                >
                  <IoRefreshOutline size={14} />
                  <span>Default</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={secondaryTextColor}
                onChange={(e) => setSecondaryTextColor(e.target.value)}
                className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={secondaryTextColor}
                onChange={(e) => setSecondaryTextColor(e.target.value)}
                placeholder={DEFAULT_SECONDARY_TEXT_COLOR}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {/* Preview */}
            <div className="mt-3">
              <button
                type="button"
                className="w-full py-3 rounded-lg font-medium"
                style={{ 
                  backgroundColor: secondaryColor,
                  color: secondaryTextColor
                }}
              >
                Vista previa del texto del botón
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sección del catálogo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <IoGridOutline size={24} className="text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Diseño del catálogo</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:p-6">
          {/* Columnas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Columnas en el catálogo
                <span className="text-xs text-gray-500 ml-2">(Desktop)</span>
              </label>
              {hasCatalogColumns && (
                <button
                  type="button"
                  onClick={() => handleResetToDefault('catalog.columns')}
                  disabled={deletingKey === 'catalog.columns'}
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Restaurar al valor por defecto"
                >
                  <IoRefreshOutline size={14} />
                  <span>Default</span>
                </button>
              )}
            </div>
            <select
              value={catalogColumns}
              onChange={(e) => setCatalogColumns(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {COLUMN_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500">
              Define cuántas columnas de productos se mostrarán en pantallas grandes
            </p>
          </div>

          {/* Tamaño de imagen */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Tamaño de las imágenes
              </label>
              {hasImageSize && (
                <button
                  type="button"
                  onClick={() => handleResetToDefault('catalog.imageSize')}
                  disabled={deletingKey === 'catalog.imageSize'}
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Restaurar al valor por defecto"
                >
                  <IoRefreshOutline size={14} />
                  <span>Default</span>
                </button>
              )}
            </div>
            <div className="space-y-2">
              {IMAGE_SIZES.map((size) => (
                <label
                  key={size.value}
                  className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="imageSize"
                    value={size.value}
                    checked={imageSize === size.value}
                    onChange={(e) => setImageSize(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{size.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mensaje de feedback */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Botón de guardar */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
};
