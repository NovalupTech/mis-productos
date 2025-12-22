'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IoCloseOutline, IoDocumentTextOutline } from 'react-icons/io5';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal = ({ isOpen, onClose }: TermsModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || typeof window === 'undefined') return null;

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 z-[9999]" 
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div 
        className="relative bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <IoDocumentTextOutline className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Términos y Condiciones</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <IoCloseOutline size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-sm max-w-none">
            <p className="text-xs text-gray-500 mb-6">
              Última actualización: {new Date().toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">1. Aceptación de los Términos</h3>
              <p className="text-gray-700 mb-3">
                Al acceder y utilizar este sitio web y realizar compras a través de nuestra plataforma, 
                usted acepta estar sujeto a estos términos y condiciones. Si no está de acuerdo con 
                alguna parte de estos términos, no debe utilizar nuestros servicios.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">2. Información del Producto</h3>
              <p className="text-gray-700 mb-3">
                Nos esforzamos por proporcionar información precisa sobre nuestros productos, incluyendo 
                descripciones, precios y disponibilidad. Sin embargo, no garantizamos que toda la 
                información sea completamente precisa, completa o actualizada. Nos reservamos el derecho 
                de corregir cualquier error, inexactitud u omisión en cualquier momento sin previo aviso.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">3. Precios y Pagos</h3>
              <p className="text-gray-700 mb-3">
                Todos los precios están expresados en la moneda indicada y están sujetos a cambios sin 
                previo aviso. Los precios finales incluyen impuestos cuando corresponda. El pago debe 
                realizarse mediante los métodos de pago aceptados que se muestran durante el proceso de 
                compra. Una vez confirmado el pago, recibirá una confirmación de su pedido.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">4. Proceso de Compra</h3>
              <p className="text-gray-700 mb-3">
                Al realizar una compra, usted declara que tiene la capacidad legal para celebrar contratos 
                vinculantes. El proceso de compra implica agregar productos al carrito, proporcionar 
                información de contacto y dirección de entrega (si aplica), y completar el pago. 
                La confirmación de su pedido se enviará por correo electrónico.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">5. Envíos y Entregas</h3>
              <p className="text-gray-700 mb-3">
                Los tiempos de entrega son estimados y pueden variar según la ubicación y el método de 
                envío seleccionado. No nos hacemos responsables por retrasos causados por terceros, 
                incluyendo servicios de mensajería. Si su pedido requiere coordinación con el vendedor, 
                se le contactará para acordar los detalles de entrega.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">6. Política de Devoluciones y Reembolsos</h3>
              <p className="text-gray-700 mb-3">
                Las políticas de devolución y reembolso pueden variar según el producto y el vendedor. 
                Por favor, contacte con nuestro servicio al cliente o con el vendedor directamente para 
                obtener información específica sobre devoluciones. Los productos deben estar en su 
                estado original y sin usar para ser elegibles para devolución.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">7. Propiedad Intelectual</h3>
              <p className="text-gray-700 mb-3">
                Todo el contenido de este sitio web, incluyendo textos, gráficos, logotipos, iconos, 
                imágenes y software, es propiedad de la empresa o sus proveedores de contenido y está 
                protegido por las leyes de propiedad intelectual. No está permitida la reproducción, 
                distribución o uso no autorizado de este contenido.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">8. Privacidad</h3>
              <p className="text-gray-700 mb-3">
                El uso de su información personal está regido por nuestra Política de Privacidad. 
                Al utilizar nuestros servicios, usted acepta el procesamiento de su información de 
                acuerdo con dicha política. Nos comprometemos a proteger su privacidad y a utilizar 
                su información únicamente para los fines descritos en nuestra política de privacidad.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">9. Limitación de Responsabilidad</h3>
              <p className="text-gray-700 mb-3">
                En la máxima medida permitida por la ley, no seremos responsables por daños indirectos, 
                incidentales, especiales o consecuentes que resulten del uso o la imposibilidad de usar 
                nuestros servicios. Nuestra responsabilidad total no excederá el monto pagado por usted 
                por los productos o servicios en cuestión.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">10. Modificaciones de los Términos</h3>
              <p className="text-gray-700 mb-3">
                Nos reservamos el derecho de modificar estos términos y condiciones en cualquier momento. 
                Las modificaciones entrarán en vigor inmediatamente después de su publicación en el sitio web. 
                Es su responsabilidad revisar periódicamente estos términos. El uso continuado de nuestros 
                servicios después de cualquier modificación constituye su aceptación de los nuevos términos.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">11. Ley Aplicable y Jurisdicción</h3>
              <p className="text-gray-700 mb-3">
                Estos términos y condiciones se regirán e interpretarán de acuerdo con las leyes del país 
                donde opera la empresa. Cualquier disputa que surja de estos términos será sometida a la 
                jurisdicción exclusiva de los tribunales competentes en dicha jurisdicción.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">12. Contacto</h3>
              <p className="text-gray-700 mb-3">
                Si tiene alguna pregunta sobre estos términos y condiciones, puede contactarnos a través 
                de los medios de contacto proporcionados en nuestro sitio web o mediante nuestro servicio 
                al cliente.
              </p>
            </section>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Nota importante:</strong> Al hacer clic en "Ir a pagar" o "Coordinar pago", 
                usted confirma que ha leído, entendido y acepta estos términos y condiciones en su totalidad.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

