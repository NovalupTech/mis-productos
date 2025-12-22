'use client';

import { useState, useEffect } from 'react';
import { upsertPaymentMethod } from '@/actions/payment-methods/upsert-payment-method';
import { PaymentMethodType, PaymentMethod } from '@prisma/client';
import { IoCheckmarkCircleOutline, IoCloseCircleOutline, IoCardOutline, IoWalletOutline, IoChatbubbleOutline, IoMailOutline } from 'react-icons/io5';
import clsx from 'clsx';
import { showErrorToast, showWarningToast, showSuccessToast } from '@/utils/toast';

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
  receiptContactType: 'email' | 'whatsapp';
  receiptEmail?: string;
  receiptWhatsApp?: string;
}

interface CoordinateWithSellerConfig {
  contactType: 'whatsapp' | 'email';
  whatsappNumber?: string;
  email?: string;
}

interface PayPalConfig {
  clientId: string;
  clientSecret: string;
}

interface MercadoPagoConfig {
  clientId: string;
  accessToken: string;
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
    receiptContactType: 'email',
    receiptEmail: '',
    receiptWhatsApp: '',
  });

  // Estados para formulario de coordinar con vendedor
  const [coordinateWithSellerConfig, setCoordinateWithSellerConfig] = useState<CoordinateWithSellerConfig>({
    contactType: 'whatsapp',
    whatsappNumber: '',
    email: '',
  });

  // Estados para formulario de PayPal
  const [paypalConfig, setPaypalConfig] = useState<PayPalConfig>({
    clientId: '',
    clientSecret: '',
  });

  // Estados para formulario de Mercado Pago
  const [mercadoPagoConfig, setMercadoPagoConfig] = useState<MercadoPagoConfig>({
    clientId: '',
    accessToken: '',
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
        receiptContactType: (bankTransfer.config.receiptContactType as 'email' | 'whatsapp') || 'email',
        receiptEmail: (bankTransfer.config.receiptEmail as string) || '',
        receiptWhatsApp: (bankTransfer.config.receiptWhatsApp as string) || '',
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

  // Cargar configuración de PayPal si existe
  useEffect(() => {
    const paypalMethod = paymentMethods.find(pm => pm.type === 'PAYPAL');
    if (paypalMethod?.config) {
      setPaypalConfig({
        clientId: (paypalMethod.config.clientId as string) || '',
        // No cargamos el clientSecret por seguridad (ya está encriptado)
        clientSecret: '',
      });
    }
  }, [paymentMethods]);

  // Cargar configuración de Mercado Pago si existe
  useEffect(() => {
    const mercadoPagoMethod = paymentMethods.find(pm => pm.type === 'MERCADOPAGO');
    if (mercadoPagoMethod?.config) {
      setMercadoPagoConfig({
        clientId: (mercadoPagoMethod.config.clientId as string) || '',
        // No cargamos el accessToken por seguridad (ya está encriptado)
        accessToken: '',
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
      } else if (type === 'PAYPAL') {
        // Verificar si PayPal ya está configurado en la base de datos
        const existingPaypalMethod = paymentMethods.find(pm => pm.type === 'PAYPAL');
        const hasExistingConfig = existingPaypalMethod?.config && 
          typeof existingPaypalMethod.config === 'object' && 
          'clientId' in existingPaypalMethod.config &&
          existingPaypalMethod.config.clientId;
        
        // Para PayPal, si está habilitando y no tiene configuración guardada ni nueva, mostrar error
        if (enabled && !hasExistingConfig && (!paypalConfig.clientId || !paypalConfig.clientSecret)) {
          showWarningToast('Por favor configura PayPal antes de habilitarlo');
          setLoading(prev => ({ ...prev, [type]: false }));
          return;
        }
        // Si tiene configuración nueva (clientId y clientSecret), enviarla para guardar/actualizar
        // Si solo tiene configuración guardada existente, no enviar config (el servidor usará la existente)
        if (paypalConfig.clientId && paypalConfig.clientSecret) {
          config = paypalConfig as unknown as Record<string, unknown>;
        }
        // Si tiene configuración guardada pero no nueva, no enviar config (undefined)
        // El servidor detectará esto y usará la configuración existente
      } else if (type === 'MERCADOPAGO') {
        // Verificar si Mercado Pago ya está configurado en la base de datos
        const existingMercadoPagoMethod = paymentMethods.find(pm => pm.type === 'MERCADOPAGO');
        const hasExistingConfig = existingMercadoPagoMethod?.config && 
          typeof existingMercadoPagoMethod.config === 'object' && 
          'clientId' in existingMercadoPagoMethod.config &&
          existingMercadoPagoMethod.config.clientId;
        
        // Para Mercado Pago, si está habilitando y no tiene configuración guardada ni nueva, mostrar error
        if (enabled && !hasExistingConfig && (!mercadoPagoConfig.clientId || !mercadoPagoConfig.accessToken)) {
          showWarningToast('Por favor configura Mercado Pago antes de habilitarlo');
          setLoading(prev => ({ ...prev, [type]: false }));
          return;
        }
        // Si tiene configuración nueva (clientId y accessToken), enviarla para guardar/actualizar
        // Si solo tiene configuración guardada existente, no enviar config (el servidor usará la existente)
        if (mercadoPagoConfig.clientId && mercadoPagoConfig.accessToken) {
          config = mercadoPagoConfig as unknown as Record<string, unknown>;
        }
        // Si tiene configuración guardada pero no nueva, no enviar config (undefined)
        // El servidor detectará esto y usará la configuración existente
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
        showErrorToast(result.message || 'Error al actualizar método de pago');
      }
    } catch (error) {
      console.error('Error:', error);
      showErrorToast('Error al actualizar método de pago');
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleSaveBankTransfer = async () => {
    if (!bankTransferConfig.bankName || !bankTransferConfig.accountHolder || !bankTransferConfig.cbu) {
      showWarningToast('Por favor completa los campos requeridos');
      return;
    }
    if (bankTransferConfig.receiptContactType === 'email' && !bankTransferConfig.receiptEmail) {
      showWarningToast('Por favor ingresa el email para recibir comprobantes');
      return;
    }
    if (bankTransferConfig.receiptContactType === 'whatsapp' && !bankTransferConfig.receiptWhatsApp) {
      showWarningToast('Por favor ingresa el número de WhatsApp para recibir comprobantes');
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
        showSuccessToast('Configuración guardada exitosamente');
      } else {
        showErrorToast(result.message || 'Error al guardar configuración');
      }
    } catch (error) {
      console.error('Error:', error);
      showErrorToast('Error al guardar configuración');
    } finally {
      setLoading(prev => ({ ...prev, BANK_TRANSFER: false }));
    }
  };

  const handleSaveCoordinateWithSeller = async () => {
    if (coordinateWithSellerConfig.contactType === 'whatsapp' && !coordinateWithSellerConfig.whatsappNumber) {
      showWarningToast('Por favor ingresa el número de WhatsApp');
      return;
    }
    if (coordinateWithSellerConfig.contactType === 'email' && !coordinateWithSellerConfig.email) {
      showWarningToast('Por favor ingresa el email');
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
        showSuccessToast('Configuración guardada exitosamente');
      } else {
        showErrorToast(result.message || 'Error al guardar configuración');
      }
    } catch (error) {
      console.error('Error:', error);
      showErrorToast('Error al guardar configuración');
    } finally {
      setLoading(prev => ({ ...prev, COORDINATE_WITH_SELLER: false }));
    }
  };

  const handleSavePayPal = async () => {
    if (!paypalConfig.clientId || !paypalConfig.clientSecret) {
      showWarningToast('Por favor completa todos los campos requeridos');
      return;
    }

    const paypalMethod = paymentMethods.find(pm => pm.type === 'PAYPAL');
    const enabled = paypalMethod?.enabled || false;

    setLoading(prev => ({ ...prev, PAYPAL: true }));
    
    try {
      const result = await upsertPaymentMethod('PAYPAL', enabled, paypalConfig as unknown as Record<string, unknown>);
      
      if (result.ok && result.paymentMethod) {
        setPaymentMethods(prev => {
          const existing = prev.findIndex(pm => pm.type === 'PAYPAL');
          const converted = convertPaymentMethod(result.paymentMethod!);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = converted;
            return updated;
          }
          return [...prev, converted];
        });
        // Limpiar el campo de secret después de guardar por seguridad
        setPaypalConfig(prev => ({ ...prev, clientSecret: '' }));
        setExpandedMethod(null);
        showSuccessToast('Configuración guardada exitosamente');
      } else {
        showErrorToast(result.message || 'Error al guardar configuración');
      }
    } catch (error) {
      console.error('Error:', error);
      showErrorToast('Error al guardar configuración');
    } finally {
      setLoading(prev => ({ ...prev, PAYPAL: false }));
    }
  };

  const handleSaveMercadoPago = async () => {
    if (!mercadoPagoConfig.clientId || !mercadoPagoConfig.accessToken) {
      showWarningToast('Por favor completa todos los campos requeridos');
      return;
    }

    const mercadoPagoMethod = paymentMethods.find(pm => pm.type === 'MERCADOPAGO');
    const enabled = mercadoPagoMethod?.enabled || false;

    setLoading(prev => ({ ...prev, MERCADOPAGO: true }));
    
    try {
      const result = await upsertPaymentMethod('MERCADOPAGO', enabled, mercadoPagoConfig as unknown as Record<string, unknown>);
      
      if (result.ok && result.paymentMethod) {
        setPaymentMethods(prev => {
          const existing = prev.findIndex(pm => pm.type === 'MERCADOPAGO');
          const converted = convertPaymentMethod(result.paymentMethod!);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = converted;
            return updated;
          }
          return [...prev, converted];
        });
        // Limpiar el campo de accessToken después de guardar por seguridad
        setMercadoPagoConfig(prev => ({ ...prev, accessToken: '' }));
        setExpandedMethod(null);
        showSuccessToast('Configuración guardada exitosamente');
      } else {
        showErrorToast(result.message || 'Error al guardar configuración');
      }
    } catch (error) {
      console.error('Error:', error);
      showErrorToast('Error al guardar configuración');
    } finally {
      setLoading(prev => ({ ...prev, MERCADOPAGO: false }));
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
      case 'MERCADOPAGO':
        return {
          name: 'Mercado Pago',
          description: 'Permite a tus clientes pagar con Mercado Pago',
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setExpandedMethod(expandedMethod === 'PAYPAL' ? null : 'PAYPAL')}
              className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              {expandedMethod === 'PAYPAL' ? 'Ocultar' : 'Configurar'}
            </button>
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

        {expandedMethod === 'PAYPAL' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-md font-semibold text-gray-800 mb-4">Configuración de PayPal</h4>
            {paypalConfig.clientId && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  <strong>PayPal está configurado.</strong> El Client Secret está guardado de forma segura y encriptada.
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Si necesitas actualizar las credenciales, completa ambos campos y guarda nuevamente.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={paypalConfig.clientId}
                  onChange={(e) => setPaypalConfig(prev => ({ ...prev, clientId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTt"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Secret <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={paypalConfig.clientSecret}
                  onChange={(e) => setPaypalConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={paypalConfig.clientId ? "Ingresa el nuevo secret para actualizar" : "El secret se guardará encriptado"}
                />
                <p className="text-xs text-gray-500 mt-1">
                  El Client Secret se guardará encriptado de forma segura usando AES-256-GCM
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSavePayPal}
                disabled={loading.PAYPAL || !paypalConfig.clientId || !paypalConfig.clientSecret}
                className={clsx(
                  'px-6 py-2 rounded-lg font-medium transition-colors',
                  {
                    'bg-blue-600 text-white hover:bg-blue-700': !loading.PAYPAL && paypalConfig.clientId && paypalConfig.clientSecret,
                    'bg-gray-300 text-gray-500 cursor-not-allowed': loading.PAYPAL || !paypalConfig.clientId || !paypalConfig.clientSecret,
                  }
                )}
              >
                {loading.PAYPAL ? 'Guardando...' : paypalConfig.clientId ? 'Actualizar Configuración' : 'Guardar Configuración'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mercado Pago */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <IoCardOutline size={24} className="text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Mercado Pago</h3>
              <p className="text-sm text-gray-600">Permite a tus clientes pagar con Mercado Pago</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setExpandedMethod(expandedMethod === 'MERCADOPAGO' ? null : 'MERCADOPAGO')}
              className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              {expandedMethod === 'MERCADOPAGO' ? 'Ocultar' : 'Configurar'}
            </button>
            <button
              onClick={() => handleToggle('MERCADOPAGO', !isMethodEnabled('MERCADOPAGO'))}
              disabled={loading.MERCADOPAGO}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                {
                  'bg-green-100 text-green-700 hover:bg-green-200': isMethodEnabled('MERCADOPAGO'),
                  'bg-gray-100 text-gray-600 hover:bg-gray-200': !isMethodEnabled('MERCADOPAGO'),
                  'opacity-50 cursor-not-allowed': loading.MERCADOPAGO,
                }
              )}
            >
              {isMethodEnabled('MERCADOPAGO') ? (
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

        {expandedMethod === 'MERCADOPAGO' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-md font-semibold text-gray-800 mb-4">Configuración de Mercado Pago</h4>
            {mercadoPagoConfig.clientId && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  <strong>Mercado Pago está configurado.</strong> El Access Token está guardado de forma segura y encriptada.
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Si necesitas actualizar las credenciales, completa ambos campos y guarda nuevamente.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Public Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={mercadoPagoConfig.clientId}
                  onChange={(e) => setMercadoPagoConfig(prev => ({ ...prev, clientId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: APP_USR-1234567890-123456-..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Token <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={mercadoPagoConfig.accessToken}
                  onChange={(e) => setMercadoPagoConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={mercadoPagoConfig.clientId ? "Ingresa el nuevo access token para actualizar" : "El access token se guardará encriptado"}
                />
                <p className="text-xs text-gray-500 mt-1">
                  El Access Token se guardará encriptado de forma segura usando AES-256-GCM
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveMercadoPago}
                disabled={loading.MERCADOPAGO || !mercadoPagoConfig.clientId || !mercadoPagoConfig.accessToken}
                className={clsx(
                  'px-6 py-2 rounded-lg font-medium transition-colors',
                  {
                    'bg-blue-600 text-white hover:bg-blue-700': !loading.MERCADOPAGO && mercadoPagoConfig.clientId && mercadoPagoConfig.accessToken,
                    'bg-gray-300 text-gray-500 cursor-not-allowed': loading.MERCADOPAGO || !mercadoPagoConfig.clientId || !mercadoPagoConfig.accessToken,
                  }
                )}
              >
                {loading.MERCADOPAGO ? 'Guardando...' : mercadoPagoConfig.clientId ? 'Actualizar Configuración' : 'Guardar Configuración'}
              </button>
            </div>
          </div>
        )}
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

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-md font-semibold text-gray-800 mb-4">Recibir Comprobante</h4>
              <p className="text-sm text-gray-600 mb-4">
                Configura cómo quieres recibir los comprobantes de transferencia
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Contacto <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="receiptContactType"
                        value="email"
                        checked={bankTransferConfig.receiptContactType === 'email'}
                        onChange={(e) => setBankTransferConfig(prev => ({ ...prev, receiptContactType: 'email' as const }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <IoMailOutline size={20} className="text-blue-600" />
                      <span className="text-sm text-gray-700">Email</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="receiptContactType"
                        value="whatsapp"
                        checked={bankTransferConfig.receiptContactType === 'whatsapp'}
                        onChange={(e) => setBankTransferConfig(prev => ({ ...prev, receiptContactType: 'whatsapp' as const }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <IoChatbubbleOutline size={20} className="text-green-600" />
                      <span className="text-sm text-gray-700">WhatsApp</span>
                    </label>
                  </div>
                </div>

                {bankTransferConfig.receiptContactType === 'email' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email para recibir comprobantes <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={bankTransferConfig.receiptEmail || ''}
                      onChange={(e) => setBankTransferConfig(prev => ({ ...prev, receiptEmail: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: ventas@tienda.com"
                    />
                  </div>
                )}

                {bankTransferConfig.receiptContactType === 'whatsapp' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de WhatsApp para recibir comprobantes <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={bankTransferConfig.receiptWhatsApp || ''}
                      onChange={(e) => setBankTransferConfig(prev => ({ ...prev, receiptWhatsApp: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: +5491123456789"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Incluye el código de país (ej: +54 para Argentina)
                    </p>
                  </div>
                )}
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
