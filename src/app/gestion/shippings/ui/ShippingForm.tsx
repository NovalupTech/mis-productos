'use client';

import { useState, useEffect } from 'react';
import { updateShippingConfig } from '@/actions/shipping/update-shipping-config';
import { IoCheckmarkCircleOutline, IoCloseCircleOutline } from 'react-icons/io5';
import clsx from 'clsx';
import { showErrorToast, showSuccessToast } from '@/utils/toast';

interface ShippingConfig {
  enabled: boolean;
  type: 'company' | 'none';
}

interface ShippingFormProps {
  initialConfig: ShippingConfig;
}

export const ShippingForm = ({ initialConfig }: ShippingFormProps) => {
  const [config, setConfig] = useState<ShippingConfig>(initialConfig);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const result = await updateShippingConfig(config);
      if (result.ok) {
        showSuccessToast('Configuración guardada exitosamente');
      } else {
        showErrorToast(result.message || 'Error al guardar configuración');
      }
    } catch (error) {
      console.error('Error:', error);
      showErrorToast('Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Checkbox: Manejar envíos */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Manejar Envíos</h3>
            <p className="text-sm text-gray-600 mt-1">
              Activa esta opción si tu empresa maneja envíos de productos
            </p>
          </div>
          <button
            onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
            disabled={loading}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              {
                'bg-green-100 text-green-700 hover:bg-green-200': config.enabled,
                'bg-gray-100 text-gray-600 hover:bg-gray-200': !config.enabled,
                'opacity-50 cursor-not-allowed': loading,
              }
            )}
          >
            {config.enabled ? (
              <>
                <IoCheckmarkCircleOutline size={20} />
                <span>Activado</span>
              </>
            ) : (
              <>
                <IoCloseCircleOutline size={20} />
                <span>Desactivado</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Radios: Tipo de envío */}
      {config.enabled && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tipo de Envío</h3>
          <p className="text-sm text-gray-600 mb-4">
            Selecciona cómo maneja tu empresa los envíos
          </p>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="shippingType"
                value="company"
                checked={config.type === 'company'}
                onChange={() => setConfig(prev => ({ ...prev, type: 'company' }))}
                className="w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-800">
                  Los envíos son manejados por la compañía
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  Tu empresa se encarga de coordinar y realizar los envíos
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="shippingType"
                value="none"
                checked={config.type === 'none'}
                onChange={() => setConfig(prev => ({ ...prev, type: 'none' }))}
                className="w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-800">
                  No manejamos envíos
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  Los clientes deben coordinar el envío por su cuenta
                </p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Botón de guardar */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </div>
  );
};
