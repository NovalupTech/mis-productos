'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateCompanyConfig, deleteCompanyConfig } from '@/actions';
import { IoCubeOutline, IoRefreshOutline, IoEyeOutline, IoEyeOffOutline, IoWarningOutline, IoRemoveOutline } from 'react-icons/io5';

interface StockFormProps {
  initialConfig: Record<string, any>;
}

// Valores por defecto
const DEFAULT_SHOW_IN_DETAILS = true;
const DEFAULT_SHOW_LOW_STOCK_MESSAGE = true;
const DEFAULT_LOW_STOCK_THRESHOLD = 5;
const DEFAULT_SUBTRACT_ON_ORDER = true;

export const StockForm = ({ initialConfig }: StockFormProps) => {
  const router = useRouter();
  const [showInDetails, setShowInDetails] = useState<boolean>(
    initialConfig['stock.showInDetails'] !== undefined 
      ? initialConfig['stock.showInDetails'] 
      : DEFAULT_SHOW_IN_DETAILS
  );
  const [showLowStockMessage, setShowLowStockMessage] = useState<boolean>(
    initialConfig['stock.showLowStockMessage'] !== undefined 
      ? initialConfig['stock.showLowStockMessage'] 
      : DEFAULT_SHOW_LOW_STOCK_MESSAGE
  );
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(
    initialConfig['stock.lowStockThreshold'] !== undefined 
      ? initialConfig['stock.lowStockThreshold'] 
      : DEFAULT_LOW_STOCK_THRESHOLD
  );
  const [subtractOnOrder, setSubtractOnOrder] = useState<boolean>(
    initialConfig['stock.subtractOnOrder'] !== undefined 
      ? initialConfig['stock.subtractOnOrder'] 
      : DEFAULT_SUBTRACT_ON_ORDER
  );
  const [loading, setLoading] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Verificar si cada configuración existe (no es default)
  const hasShowInDetails = initialConfig['stock.showInDetails'] !== undefined;
  const hasShowLowStockMessage = initialConfig['stock.showLowStockMessage'] !== undefined;
  const hasLowStockThreshold = initialConfig['stock.lowStockThreshold'] !== undefined;
  const hasSubtractOnOrder = initialConfig['stock.subtractOnOrder'] !== undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validar que el umbral sea un número positivo
    if (lowStockThreshold < 0) {
      setMessage({
        type: 'error',
        text: 'El umbral de stock bajo debe ser un número positivo',
      });
      setLoading(false);
      return;
    }

    try {
      const result = await updateCompanyConfig([
        { key: 'stock.showInDetails', value: showInDetails },
        { key: 'stock.showLowStockMessage', value: showLowStockMessage },
        { key: 'stock.lowStockThreshold', value: lowStockThreshold },
        { key: 'stock.subtractOnOrder', value: subtractOnOrder },
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
        if (key === 'stock.showInDetails') {
          setShowInDetails(DEFAULT_SHOW_IN_DETAILS);
        } else if (key === 'stock.showLowStockMessage') {
          setShowLowStockMessage(DEFAULT_SHOW_LOW_STOCK_MESSAGE);
        } else if (key === 'stock.lowStockThreshold') {
          setLowStockThreshold(DEFAULT_LOW_STOCK_THRESHOLD);
        } else if (key === 'stock.subtractOnOrder') {
          setSubtractOnOrder(DEFAULT_SUBTRACT_ON_ORDER);
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
      {/* Sección: Mostrar stock en detalles */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {showInDetails ? (
              <IoEyeOutline className="text-gray-600" size={20} />
            ) : (
              <IoEyeOffOutline className="text-gray-600" size={20} />
            )}
            <h2 className="text-lg font-semibold text-gray-800">Mostrar stock en detalles</h2>
          </div>
          {hasShowInDetails && (
            <button
              type="button"
              onClick={() => handleResetToDefault('stock.showInDetails')}
              disabled={deletingKey === 'stock.showInDetails'}
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
              checked={showInDetails}
              onChange={(e) => setShowInDetails(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">
                Mostrar stock disponible en la página de detalles del producto
              </span>
              <p className="text-xs text-gray-500 mt-1">
                Si está activado, los clientes podrán ver cuántas unidades hay disponibles de cada producto
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Sección: Mensaje de stock bajo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <IoWarningOutline className="text-gray-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-800">Mensaje de stock bajo</h2>
          </div>
          {hasShowLowStockMessage && (
            <button
              type="button"
              onClick={() => handleResetToDefault('stock.showLowStockMessage')}
              disabled={deletingKey === 'stock.showLowStockMessage'}
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
              checked={showLowStockMessage}
              onChange={(e) => setShowLowStockMessage(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">
                Mostrar mensaje cuando el stock esté bajo
              </span>
              <p className="text-xs text-gray-500 mt-1">
                Si está activado, se mostrará un mensaje de advertencia cuando el stock esté por debajo del umbral configurado
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Sección: Umbral de stock bajo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <IoCubeOutline className="text-gray-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-800">Umbral de stock bajo</h2>
          </div>
          {hasLowStockThreshold && (
            <button
              type="button"
              onClick={() => handleResetToDefault('stock.lowStockThreshold')}
              disabled={deletingKey === 'stock.lowStockThreshold'}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Restaurar al valor por defecto"
            >
              <IoRefreshOutline size={14} />
              <span>Default</span>
            </button>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700 mb-2">
            Cantidad mínima de stock para mostrar el mensaje
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              id="lowStockThreshold"
              min="0"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 0)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <span className="text-sm text-gray-600">unidades</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Cuando el stock de un producto sea igual o menor a este número, se mostrará el mensaje de advertencia (si está habilitado)
          </p>
          {showLowStockMessage && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Ejemplo:</strong> Si el umbral es {lowStockThreshold}, un producto con {lowStockThreshold} o menos unidades mostrará el mensaje: "Solo quedan {lowStockThreshold} disponibles"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sección: Restar stock al hacer pedido */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <IoRemoveOutline className="text-gray-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-800">Restar stock al hacer pedido</h2>
          </div>
          {hasSubtractOnOrder && (
            <button
              type="button"
              onClick={() => handleResetToDefault('stock.subtractOnOrder')}
              disabled={deletingKey === 'stock.subtractOnOrder'}
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
              checked={subtractOnOrder}
              onChange={(e) => setSubtractOnOrder(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">
                Restar automáticamente el stock cuando se realiza un pedido
              </span>
              <p className="text-xs text-gray-500 mt-1">
                Si está activado, el stock del producto se reducirá automáticamente cuando un cliente complete una orden. Si está desactivado, deberás restar el stock manualmente.
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
