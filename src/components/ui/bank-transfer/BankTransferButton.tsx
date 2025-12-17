'use client';

import { useState, useRef } from 'react';
import { IoWalletOutline, IoChevronDownOutline, IoChevronUpOutline, IoChatbubbleOutline, IoMailOutline, IoCloseOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';
import { FaWhatsapp } from 'react-icons/fa';

interface Props {
  orderId: string;
  amount: number;
  config: {
    bankName: string;
    accountHolder: string;
    cbu: string;
    alias?: string;
    dni?: string;
    notes?: string;
    receiptContactType?: 'email' | 'whatsapp';
    receiptEmail?: string;
    receiptWhatsApp?: string;
  };
  coordinateWithSellerConfig?: {
    contactType: 'whatsapp' | 'email';
    whatsappNumber?: string;
    email?: string;
  };
}

export const BankTransferButton = ({ orderId, amount: _amount, config, coordinateWithSellerConfig }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (validTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Por favor selecciona un archivo PDF o una imagen (JPG, PNG, GIF, WEBP)');
        setFile(null);
      }
    }
  };

  const handleSubmitReceipt = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    if (!coordinateWithSellerConfig) {
      setError('No hay configuración disponible para enviar el comprobante');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('orderId', orderId);
      formData.append('contactType', coordinateWithSellerConfig.contactType);
      if (coordinateWithSellerConfig.contactType === 'email' && coordinateWithSellerConfig.email) {
        formData.append('email', coordinateWithSellerConfig.email);
      }
      if (coordinateWithSellerConfig.contactType === 'whatsapp' && coordinateWithSellerConfig.whatsappNumber) {
        formData.append('whatsappNumber', coordinateWithSellerConfig.whatsappNumber);
      }

      const response = await fetch('/api/orders/send-receipt', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || 'Error al enviar el comprobante');
      }

      // Si es WhatsApp, abrir el enlace de WhatsApp
      if (coordinateWithSellerConfig?.contactType === 'whatsapp' && result.whatsappUrl) {
        window.open(result.whatsappUrl, '_blank');
      }

      setUploadSuccess(true);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        setShowModal(false);
        setUploadSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el comprobante');
    } finally {
      setUploading(false);
    }
  };

  const handleCloseModal = () => {
    if (!uploading) {
      setShowModal(false);
      setFile(null);
      setError(null);
      setUploadSuccess(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-3 px-4 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 mb-2"
      >
        <IoWalletOutline size={20} />
        <span>Transferencia Bancaria</span>
        {isOpen ? (
          <IoChevronUpOutline size={20} className="ml-auto" />
        ) : (
          <IoChevronDownOutline size={20} className="ml-auto" />
        )}
      </button>

      {isOpen && (
        <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
          <div className="space-y-2 text-sm text-gray-700 mb-4">
            <div>
              <span className="font-medium">Banco:</span> {config.bankName}
            </div>
            <div>
              <span className="font-medium">Titular:</span> {config.accountHolder}
            </div>
            <div>
              <span className="font-medium">CBU:</span> {config.cbu}
            </div>
            {config.alias && (
              <div>
                <span className="font-medium">Alias:</span> {config.alias}
              </div>
            )}
            {config.dni && (
              <div>
                <span className="font-medium">DNI:</span> {config.dni}
              </div>
            )}
            {config.notes && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <span className="font-medium">Notas:</span> {config.notes}
              </div>
            )}
          </div>

          {/* <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-800">
            <p className="font-medium mb-1">Importante:</p>
            <p className="mb-2">Una vez realizada la transferencia, envía el comprobante al vendedor para confirmar tu pago.</p>
            {config.receiptContactType === 'whatsapp' && config.receiptWhatsApp && (
              <div className="mt-2 pt-2 border-t border-yellow-300">
                <p className="font-medium mb-1">Enviar comprobante por WhatsApp:</p>
                <a
                  href={`https://wa.me/${config.receiptWhatsApp.replace(/[^\d+]/g, '').startsWith('+') ? config.receiptWhatsApp.replace(/[^\d+]/g, '') : `+54${config.receiptWhatsApp.replace(/[^\d+]/g, '')}`}?text=${encodeURIComponent(`Hola, aquí está el comprobante de transferencia para la orden #${orderId}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-green-700 hover:text-green-800 font-medium underline"
                >
                  <FaWhatsapp size={14} />
                  {config.receiptWhatsApp}
                </a>
              </div>
            )}
            {config.receiptContactType === 'email' && config.receiptEmail && (
              <div className="mt-2 pt-2 border-t border-yellow-300">
                <p className="font-medium mb-1">Enviar comprobante por Email:</p>
                <a
                  href={`mailto:${config.receiptEmail}?subject=${encodeURIComponent(`Comprobante de transferencia - Orden #${orderId}`)}&body=${encodeURIComponent(`Hola,\n\nAdjunto el comprobante de transferencia para la orden #${orderId}.\n\nGracias.`)}`}
                  className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-800 font-medium underline"
                >
                  <IoMailOutline size={14} />
                  {config.receiptEmail}
                </a>
              </div>
            )}
          </div> */}

          {coordinateWithSellerConfig && (
            <div className="mt-4">
              <button
                onClick={() => setShowModal(true)}
                className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <IoCheckmarkCircleOutline size={18} />
                Ya pagué
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal para subir comprobante */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Enviar comprobante</h3>
              <button
                onClick={handleCloseModal}
                disabled={uploading}
                className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                <IoCloseOutline size={24} />
              </button>
            </div>

            {uploadSuccess ? (
              <div className="text-center py-4">
                <IoCheckmarkCircleOutline size={48} className="text-green-600 mx-auto mb-2" />
                <p className="text-green-700 font-medium">¡Comprobante enviado exitosamente!</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecciona el comprobante (PDF o imagen)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {file && (
                    <p className="mt-2 text-sm text-gray-600">
                      Archivo seleccionado: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleCloseModal}
                    disabled={uploading}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmitReceipt}
                    disabled={!file || uploading}
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Enviando...
                      </>
                    ) : (
                      'Enviar'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
