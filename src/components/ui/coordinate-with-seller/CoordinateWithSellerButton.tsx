'use client';

import { IoChatbubbleOutline, IoMailOutline } from 'react-icons/io5';
import { FaWhatsapp } from 'react-icons/fa';

interface Props {
  orderId: string;
  amount: number;
  config: {
    contactType: 'whatsapp' | 'email';
    whatsappNumber?: string;
    email?: string;
  };
}

export const CoordinateWithSellerButton = ({ orderId, amount, config }: Props) => {
  const isWhatsApp = config.contactType === 'whatsapp';
  const contactInfo = isWhatsApp ? config.whatsappNumber : config.email;

  const handleContact = () => {
    if (isWhatsApp && config.whatsappNumber) {
      // Formatear número para WhatsApp (remover espacios y caracteres especiales excepto +)
      // Si no tiene +, agregarlo al inicio si es necesario
      let phoneNumber = config.whatsappNumber.replace(/[^\d+]/g, '');
      if (!phoneNumber.startsWith('+')) {
        // Si no tiene código de país, asumir que es Argentina (+54)
        phoneNumber = `+54${phoneNumber}`;
      }
      // Construir URL completa de la orden
      const orderUrl = `${window.location.origin}/catalog/orders/${orderId}`;
      const message = encodeURIComponent(`Hola, quiero coordinar el pago de mi pedido #${orderId}\n\nPuedes ver los detalles aquí: ${orderUrl}`);
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    } else if (config.email) {
      const subject = encodeURIComponent(`Coordinación de pago - Pedido #${orderId}`);
      const body = encodeURIComponent(`Hola,\n\nQuiero coordinar el pago de mi pedido #${orderId}.\n\nGracias.`);
      window.open(`mailto:${config.email}?subject=${subject}&body=${body}`, '_blank');
    }
  };

  return (
    <div className="w-full mb-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
      <div className="flex items-center gap-2 mb-3">
        {isWhatsApp ? (
          <IoChatbubbleOutline size={20} className="text-green-600" />
        ) : (
          <IoMailOutline size={20} className="text-blue-600" />
        )}
        <h3 className="font-semibold text-gray-800">
          Coordinar con el Vendedor
        </h3>
      </div>
      
      <div className="space-y-2 text-sm text-gray-700 mb-4">
        <p>
          Contacta al vendedor para coordinar el pago de tu pedido.
        </p>
      </div>

      <button
        onClick={handleContact}
        className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2 ${
          isWhatsApp
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isWhatsApp ? (
          <>
            <FaWhatsapp size={20} />
            <span>Contactar por WhatsApp</span>
          </>
        ) : (
          <>
            <IoMailOutline size={20} />
            <span>Contactar por Email</span>
          </>
        )}
      </button>
    </div>
  );
};
