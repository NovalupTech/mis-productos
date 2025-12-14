'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateCompanyConfig, deleteCompanyConfig } from '@/actions';
import { IoPricetagOutline, IoRefreshOutline, IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';

interface PricesFormProps {
  initialConfig: Record<string, any>;
}

const CURRENCIES = [
  { value: 'USD', label: 'USD - Dólar estadounidense', symbol: '$' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { value: 'ARS', label: 'ARS - Peso argentino', symbol: '$' },
  { value: 'MXN', label: 'MXN - Peso mexicano', symbol: '$' },
  { value: 'CLP', label: 'CLP - Peso chileno', symbol: '$' },
  { value: 'COP', label: 'COP - Peso colombiano', symbol: '$' },
  { value: 'BRL', label: 'BRL - Real brasileño', symbol: 'R$' },
  { value: 'PEN', label: 'PEN - Sol peruano', symbol: 'S/' },
];

const FORMAT_OPTIONS = [
  { value: 'symbol-before', label: 'Símbolo antes (ej: $100)' },
  { value: 'symbol-after', label: 'Símbolo después (ej: 100$)' },
  { value: 'code-before', label: 'Código antes (ej: USD 100)' },
  { value: 'code-after', label: 'Código después (ej: 100 USD)' },
];

// Valores por defecto
const DEFAULT_CURRENCY = 'USD';
const DEFAULT_FORMAT = 'symbol-before';
const DEFAULT_SHOW_PRICES = true;

export const PricesForm = ({ initialConfig }: PricesFormProps) => {
  const router = useRouter();
  const [currency, setCurrency] = useState<string>(
    initialConfig['prices.currency'] || DEFAULT_CURRENCY
  );
  const [format, setFormat] = useState<string>(
    initialConfig['prices.format'] || DEFAULT_FORMAT
  );
  const [showPrices, setShowPrices] = useState<boolean>(
    initialConfig['prices.showPrices'] !== undefined 
      ? initialConfig['prices.showPrices'] 
      : DEFAULT_SHOW_PRICES
  );
  const [loading, setLoading] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Verificar si cada configuración existe (no es default)
  const hasCurrency = !!initialConfig['prices.currency'];
  const hasFormat = !!initialConfig['prices.format'];
  const hasShowPrices = initialConfig['prices.showPrices'] !== undefined;

  // Obtener el símbolo de la moneda seleccionada
  const selectedCurrency = CURRENCIES.find(c => c.value === currency);
  const currencySymbol = selectedCurrency?.symbol || '$';

  // Función para formatear el precio de ejemplo
  const formatExamplePrice = (value: number, currencyCode: string, formatType: string) => {
    const currency = CURRENCIES.find(c => c.value === currencyCode);
    const symbol = currency?.symbol || '$';
    
    switch (formatType) {
      case 'symbol-before':
        return `${symbol}${value}`;
      case 'symbol-after':
        return `${value}${symbol}`;
      case 'code-before':
        return `${currencyCode} ${value}`;
      case 'code-after':
        return `${value} ${currencyCode}`;
      default:
        return `${symbol}${value}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const result = await updateCompanyConfig([
        { key: 'prices.currency', value: currency },
        { key: 'prices.format', value: format },
        { key: 'prices.showPrices', value: showPrices },
      ]);

      if (result.ok) {
        setMessage({
          type: 'success',
          text: result.message || 'Configuraciones guardadas correctamente',
        });
        router.refresh();
      } else {
        setMessage({
          type: 'error',
          text: result.message || 'Error al guardar las configuraciones',
        });
      }
    } catch (error) {
      console.error('Error al guardar configuraciones:', error);
      setMessage({
        type: 'error',
        text: 'Error al guardar las configuraciones',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefault = async (key: string) => {
    setDeletingKey(key);
    try {
      const result = await deleteCompanyConfig(key);
      if (result.ok) {
        // Restaurar valores locales al default
        if (key === 'prices.currency') {
          setCurrency(DEFAULT_CURRENCY);
        } else if (key === 'prices.format') {
          setFormat(DEFAULT_FORMAT);
        } else if (key === 'prices.showPrices') {
          setShowPrices(DEFAULT_SHOW_PRICES);
        }
        router.refresh();
      } else {
        setMessage({
          type: 'error',
          text: result.message || 'Error al restaurar la configuración',
        });
      }
    } catch (error) {
      console.error('Error al eliminar configuración:', error);
      setMessage({
        type: 'error',
        text: 'Error al restaurar la configuración',
      });
    } finally {
      setDeletingKey(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl">
      {/* Sección: Moneda */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <IoPricetagOutline className="text-gray-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-800">Moneda</h2>
          </div>
          {hasCurrency && (
            <button
              type="button"
              onClick={() => handleResetToDefault('prices.currency')}
              disabled={deletingKey === 'prices.currency'}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Restaurar al valor por defecto"
            >
              <IoRefreshOutline size={14} />
              <span>Default</span>
            </button>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecciona la moneda
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CURRENCIES.map((curr) => (
              <option key={curr.value} value={curr.value}>
                {curr.label}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-600">
          <p className="font-medium mb-1">Vista previa:</p>
          <p className="text-lg font-semibold" style={{ color: 'var(--theme-secondary-color)' }}>
            {formatExamplePrice(100, currency, format)}
          </p>
        </div>
      </div>

      {/* Sección: Formato */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <IoPricetagOutline className="text-gray-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-800">Formato de precio</h2>
          </div>
          {hasFormat && (
            <button
              type="button"
              onClick={() => handleResetToDefault('prices.format')}
              disabled={deletingKey === 'prices.format'}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Restaurar al valor por defecto"
            >
              <IoRefreshOutline size={14} />
              <span>Default</span>
            </button>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Formato de visualización
          </label>
          <div className="space-y-2">
            {FORMAT_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="radio"
                  name="format"
                  value={option.value}
                  checked={format === option.value}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700">{option.label}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    ({formatExamplePrice(100, currency, option.value)})
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Sección: Mostrar precios */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {showPrices ? (
              <IoEyeOutline className="text-gray-600" size={20} />
            ) : (
              <IoEyeOffOutline className="text-gray-600" size={20} />
            )}
            <h2 className="text-lg font-semibold text-gray-800">Visibilidad de precios</h2>
          </div>
          {hasShowPrices && (
            <button
              type="button"
              onClick={() => handleResetToDefault('prices.showPrices')}
              disabled={deletingKey === 'prices.showPrices'}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Restaurar al valor por defecto"
            >
              <IoRefreshOutline size={14} />
              <span>Default</span>
            </button>
          )}
        </div>
        <div className="mb-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showPrices}
              onChange={(e) => setShowPrices(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">
                Mostrar precios en la tienda
              </span>
              <p className="text-xs text-gray-500 mt-1">
                Si está desactivado, los precios no se mostrarán en el catálogo ni en las páginas de productos
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Botón de guardar */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      {/* Mensaje de feedback */}
      {message && (
        <div
          className={`mt-4 p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}
    </form>
  );
};
