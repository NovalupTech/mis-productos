'use client';

import { useState, useEffect } from 'react';
import { upsertPaymentMethod } from '@/actions/payment-methods/upsert-payment-method';
import { PaymentMethodType, PaymentMethod } from '@prisma/client';
import { IoCheckmarkCircleOutline, IoCloseCircleOutline, IoCardOutline, IoWalletOutline, IoChatbubbleOutline, IoMailOutline } from 'react-icons/io5';
import clsx from 'clsx';

interface PaymentMethodFormData {
  id: string;
  type: PaymentMethodType;
  enabled: boolean;
  config: Record<string, unknown> | null;
}

interface PaymentMethodsFormProps {
  initialPaymentMethods: PaymentMethod[];
}

// Helper para convertir PaymentMethod de Prisma a PaymentMethodFormData
const convertPaymentMethod = (pm: PaymentMethod): PaymentMethodFormData => {
  return {
    id: pm.id,
    type: pm.type,
    enabled: pm.enabled,
    config: pm.config ? (pm.config as Record<string, unknown>) : null,
  };
};

interface BankTransferConfig {
  bankName: string;
  accountHolder: string;
  cbu: string;
  alias?: string;
  dni?: string;
  notes?: string;
}

interface CoordinateWithSellerConfig {
  contactType: 'whatsapp' | 'email';
  whatsappNumber?: string;
  email?: string;
}

export const PaymentMethodsForm = ({ initialPaymentMethods }: PaymentMethodsFormProps) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodFormData[]>(
    initialPaymentMethods.map(convertPaymentMethod)
  );
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [expandedMethod, setExpandedMethod] = useState<PaymentMethodType | null>(null);
  
  // Estados para formulario de transferencia bancaria
  const [bankTransferConfig, setBankTransferConfig] = useState<BankTransferConfig>({
    bankName: '',
    accountHolder: '',
    cbu: '',
    alias: '',
    dni: '',
    notes: '',
  });

  // Estados para formulario de coordinar con vendedor
  const [coordinateWithSellerConfig, setCoordinateWithSellerConfig] = useState<CoordinateWithSellerConfig>({
    contactType: 'whatsapp',
    whatsappNumber: '',
    email: '',
  });

  // Cargar configuración de transferencia bancaria si existe
  useEffect(() => {
    const bankTransfer = paymentMethods.find(pm => pm.type === 'BANK_TRANSFER');
    if (bankTransfer?.config) {
      setBankTransferConfig({
        bankName: (bankTransfer.config.bankName as string) || '',
        accountHolder: (bankTransfer.config.accountHolder as string) || '',
        cbu: (bankTransfer.config.cbu as string) || '',
        alias: (bankTransfer.config.alias as string) || '',
        dni: (bankTransfer.config.dni as string) || '',
        notes: (bankTransfer.config.notes as string) || '',
      });
    }
  }, [paymentMethods]);

  // Cargar configuración de coordinar con vendedor si existe
  useEffect(() => {
    const coordinateMethod = paymentMethods.find(pm => pm.type === 'COORDINATE_WITH_SELLER');
    if (coordinateMethod?.config) {
      setCoordinateWithSellerConfig({
        contactType: (coordinateMethod.config.contactType as 'whatsapp' | 'email') || 'whatsapp',
        whatsappNumber: (coordinateMethod.config.whatsappNumber as string) || '',
        email: (coordinateMethod.config.email as string) || '',
      });
    }
  }, [paymentMethods]);

  const handleToggle = async (type: PaymentMethodType, enabled: boolean) => {
    setLoading(prev => ({ ...prev, [type]: true }));
    
    try {
      let config: Record<string, unknown> | undefined;
      if (type === 'BANK_TRANSFER') {
        config = bankTransferConfig as unknown as Record<string, unknown>;
      } else if (type === 'COORDINATE_WITH_SELLER') {
        config = coordinateWithSellerConfig as unknown as Record<string, unknown>;
      }
      
      const result = await upsertPaymentMethod(type, enabled, config);
      
      if (result.ok && result.paymentMethod) {
        setPaymentMethods(prev => {
          const existing = prev.findIndex(pm => pm.type === type);
          const converted = convertPaymentMethod(result.paymentMethod!);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = converted;
            return updated;
          }
          return [...prev, converted];
        });
      } else {
        alert(result.message || 'Error al actualizar método de pago');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar método de pago');
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleSaveBankTransfer = async () => {
    if (!bankTransferConfig.bankName || !bankTransferConfig.accountHolder || !bankTransferConfig.cbu) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    const bankTransfer = paymentMethods.find(pm => pm.type === 'BANK_TRANSFER');
    const enabled = bankTransfer?.enabled || false;

    setLoading(prev => ({ ...prev, BANK_TRANSFER: true }));
    
    try {
      const result = await upsertPaymentMethod('BANK_TRANSFER', enabled, bankTransferConfig as unknown as Record<string, unknown>);
      
      if (result.ok && result.paymentMethod) {
        setPaymentMethods(prev => {
          const existing = prev.findIndex(pm => pm.type === 'BANK_TRANSFER');
          const converted = convertPaymentMethod(result.paymentMethod!);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = converted;
            return updated;
          }
          return [...prev, converted];
        });
        setExpandedMethod(null);
        alert('Configuración guardada exitosamente');
      } else {
        alert(result.message || 'Error al guardar configuración');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar configuración');
    } finally {
      setLoading(prev => ({ ...prev, BANK_TRANSFER: false }));
    }
  };

  const handleSaveCoordinateWithSeller = async () => {
    if (coordinateWithSellerConfig.contactType === 'whatsapp' && !coordinateWithSellerConfig.whatsappNumber) {
      alert('Por favor ingresa el número de WhatsApp');
      return;
    }
    if (coordinateWithSellerConfig.contactType === 'email' && !coordinateWithSellerConfig.email) {
      alert('Por favor ingresa el email');
      return;
    }

    const coordinateMethod = paymentMethods.find(pm => pm.type === 'COORDINATE_WITH_SELLER');
    const enabled = coordinateMethod?.enabled || false;

    setLoading(prev => ({ ...prev, COORDINATE_WITH_SELLER: true }));
    
    try {
      const result = await upsertPaymentMethod('COORDINATE_WITH_SELLER', enabled, coordinateWithSellerConfig as unknown as Record<string, unknown>);
      
      if (result.ok && result.paymentMethod) {
        setPaymentMethods(prev => {
          const existing = prev.findIndex(pm => pm.type === 'COORDINATE_WITH_SELLER');
          const converted = convertPaymentMethod(result.paymentMethod!);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = converted;
            return updated;
          }
          return [...prev, converted];
        });
        setExpandedMethod(null);
        alert('Configuración guardada exitosamente');
      } else {
        alert(result.message || 'Error al guardar configuración');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar configuración');
    } finally {
      setLoading(prev => ({ ...prev, COORDINATE_WITH_SELLER: false }));
    }
  };

  const getPaymentMethodInfo = (type: PaymentMethodType) => {
    switch (type) {
      case 'PAYPAL':
        return {
          name: 'PayPal',
          description: 'Permite a tus clientes pagar con PayPal',
          icon: IoCardOutline,
        };
      case 'BANK_TRANSFER':
        return {
          name: 'Transferencia Bancaria',
          description: 'Los clientes pueden realizar transferencias bancarias',
          icon: IoWalletOutline,
        };
      case 'COORDINATE_WITH_SELLER':
        return {
          name: 'Coordinar con el Vendedor',
          description: 'Los clientes pueden contactar al vendedor para coordinar el pago',
          icon: IoChatbubbleOutline,
        };
      default:
        return {
          name: type,
          description: '',
          icon: IoCardOutline,
        };
    }
  };

  const isMethodEnabled = (type: PaymentMethodType) => {
    return paymentMethods.find(pm => pm.type === type)?.enabled || false;
  };

  return (
    <div className="space-y-4">
      {/* PayPal */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <IoCardOutline size={24} className="text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800">PayPal</h3>
              <p className="text-sm text-gray-600">Permite a tus clientes pagar con PayPal</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('PAYPAL', !isMethodEnabled('PAYPAL'))}
            disabled={loading.PAYPAL}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              {
                'bg-green-100 text-green-700 hover:bg-green-200': isMethodEnabled('PAYPAL'),
                'bg-gray-100 text-gray-600 hover:bg-gray-200': !isMethodEnabled('PAYPAL'),
                'opacity-50 cursor-not-allowed': loading.PAYPAL,
              }
            )}
          >
            {isMethodEnabled('PAYPAL') ? (
              <>
                <IoCheckmarkCircleOutline size={20} />
                <span>Habilitado</span>
              </>
            ) : (
              <>
                <IoCloseCircleOutline size={20} />
                <span>Deshabilitado</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Transferencia Bancaria */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <IoWalletOutline size={24} className="text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Transferencia Bancaria</h3>
              <p className="text-sm text-gray-600">Los clientes pueden realizar transferencias bancarias</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setExpandedMethod(expandedMethod === 'BANK_TRANSFER' ? null : 'BANK_TRANSFER')}
              className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              {expandedMethod === 'BANK_TRANSFER' ? 'Ocultar' : 'Configurar'}
            </button>
            <button
              onClick={() => handleToggle('BANK_TRANSFER', !isMethodEnabled('BANK_TRANSFER'))}
              disabled={loading.BANK_TRANSFER}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                {
                  'bg-green-100 text-green-700 hover:bg-green-200': isMethodEnabled('BANK_TRANSFER'),
                  'bg-gray-100 text-gray-600 hover:bg-gray-200': !isMethodEnabled('BANK_TRANSFER'),
                  'opacity-50 cursor-not-allowed': loading.BANK_TRANSFER,
                }
              )}
            >
              {isMethodEnabled('BANK_TRANSFER') ? (
                <>
                  <IoCheckmarkCircleOutline size={20} />
                  <span>Habilitado</span>
                </>
              ) : (
                <>
                  <IoCloseCircleOutline size={20} />
                  <span>Deshabilitado</span>
                </>
              )}
            </button>
          </div>
        </div>

        {expandedMethod === 'BANK_TRANSFER' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-md font-semibold text-gray-800 mb-4">Datos Bancarios</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Banco <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankTransferConfig.bankName}
                  onChange={(e) => setBankTransferConfig(prev => ({ ...prev, bankName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Banco Nación"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titular de la Cuenta <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankTransferConfig.accountHolder}
                  onChange={(e) => setBankTransferConfig(prev => ({ ...prev, accountHolder: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CBU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankTransferConfig.cbu}
                  onChange={(e) => setBankTransferConfig(prev => ({ ...prev, cbu: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1234567890123456789012"
                  maxLength={22}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alias
                </label>
                <input
                  type="text"
                  value={bankTransferConfig.alias}
                  onChange={(e) => setBankTransferConfig(prev => ({ ...prev, alias: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: juan.tienda"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DNI
                </label>
                <input
                  type="text"
                  value={bankTransferConfig.dni}
                  onChange={(e) => setBankTransferConfig(prev => ({ ...prev, dni: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 30123456"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas adicionales
                </label>
                <textarea
                  value={bankTransferConfig.notes}
                  onChange={(e) => setBankTransferConfig(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Ej: Enviar comprobante por WhatsApp"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveBankTransfer}
                disabled={loading.BANK_TRANSFER}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading.BANK_TRANSFER ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Coordinar con el Vendedor */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <IoChatbubbleOutline size={24} className="text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Coordinar con el Vendedor</h3>
              <p className="text-sm text-gray-600">Los clientes pueden contactar al vendedor para coordinar el pago</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setExpandedMethod(expandedMethod === 'COORDINATE_WITH_SELLER' ? null : 'COORDINATE_WITH_SELLER')}
              className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              {expandedMethod === 'COORDINATE_WITH_SELLER' ? 'Ocultar' : 'Configurar'}
            </button>
            <button
              onClick={() => handleToggle('COORDINATE_WITH_SELLER', !isMethodEnabled('COORDINATE_WITH_SELLER'))}
              disabled={loading.COORDINATE_WITH_SELLER}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                {
                  'bg-green-100 text-green-700 hover:bg-green-200': isMethodEnabled('COORDINATE_WITH_SELLER'),
                  'bg-gray-100 text-gray-600 hover:bg-gray-200': !isMethodEnabled('COORDINATE_WITH_SELLER'),
                  'opacity-50 cursor-not-allowed': loading.COORDINATE_WITH_SELLER,
                }
              )}
            >
              {isMethodEnabled('COORDINATE_WITH_SELLER') ? (
                <>
                  <IoCheckmarkCircleOutline size={20} />
                  <span>Habilitado</span>
                </>
              ) : (
                <>
                  <IoCloseCircleOutline size={20} />
                  <span>Deshabilitado</span>
                </>
              )}
            </button>
          </div>
        </div>

        {expandedMethod === 'COORDINATE_WITH_SELLER' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-md font-semibold text-gray-800 mb-4">Configuración de Contacto</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Contacto <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="contactType"
                      value="whatsapp"
                      checked={coordinateWithSellerConfig.contactType === 'whatsapp'}
                      onChange={(e) => setCoordinateWithSellerConfig(prev => ({ ...prev, contactType: 'whatsapp' as const }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <IoChatbubbleOutline size={20} className="text-green-600" />
                    <span className="text-sm text-gray-700">WhatsApp</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="contactType"
                      value="email"
                      checked={coordinateWithSellerConfig.contactType === 'email'}
                      onChange={(e) => setCoordinateWithSellerConfig(prev => ({ ...prev, contactType: 'email' as const }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <IoMailOutline size={20} className="text-blue-600" />
                    <span className="text-sm text-gray-700">Email</span>
                  </label>
                </div>
              </div>

              {coordinateWithSellerConfig.contactType === 'whatsapp' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={coordinateWithSellerConfig.whatsappNumber || ''}
                    onChange={(e) => setCoordinateWithSellerConfig(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: +5491123456789"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Incluye el código de país (ej: +54 para Argentina)
                  </p>
                </div>
              )}

              {coordinateWithSellerConfig.contactType === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={coordinateWithSellerConfig.email || ''}
                    onChange={(e) => setCoordinateWithSellerConfig(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: contacto@tienda.com"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveCoordinateWithSeller}
                disabled={loading.COORDINATE_WITH_SELLER}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading.COORDINATE_WITH_SELLER ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
