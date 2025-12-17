import { getCurrentCompanyId } from '@/lib/domain';
import prisma from '@/lib/prisma';

interface MapSectionProps {
  content: {
    address?: string;
    width?: string;
    height?: string;
    title?: string;
  };
}

export const MapSection = async ({ content }: MapSectionProps) => {
  // Obtener la dirección de la empresa si no se proporciona en el content
  let address = content.address;
  
  if (!address) {
    const companyId = await getCurrentCompanyId();
    if (companyId) {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { address: true },
      });
      address = company?.address || undefined as string | undefined;
    }
  }

  // Si no hay dirección, no mostrar el mapa
  if (!address) {
    return null;
  }

  // Configurar tamaño del mapa (por defecto: 100% width, 400px height)
  const mapWidth = content.width || '100%';
  const mapHeight = content.height || '400px';

  // Codificar la dirección para la URL de Google Maps
  const encodedAddress = encodeURIComponent(address);
  
  // Usar Google Maps Embed API si hay API key, sino usar el método alternativo
  const hasApiKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapUrl = hasApiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodedAddress}`
    : `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <section 
      className="w-full py-12 px-4"
      style={{
        backgroundColor: 'var(--theme-primary-color)',
      }}
    >
      <div className="max-w-6xl mx-auto">
        {content.title && (
          <h2 className="text-3xl font-bold mb-6 text-gray-900 text-center">
            {content.title}
          </h2>
        )}
        <div 
          className="w-full rounded-lg overflow-hidden shadow-lg"
          style={{
            width: mapWidth,
            height: mapHeight,
            margin: '0 auto',
          }}
        >
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={mapUrl}
            title={content.title || 'Mapa de ubicación'}
          />
        </div>
        {address && (
          <div className="text-center mt-4">
            <p className="text-gray-600 mb-2">{address}</p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              Abrir en Google Maps
            </a>
          </div>
        )}
      </div>
    </section>
  );
};
