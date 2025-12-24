'use client';

import { useState, useEffect } from 'react';
import { IoShareSocialOutline, IoLogoWhatsapp, IoLogoInstagram, IoCopyOutline } from 'react-icons/io5';

interface ShareButtonProps {
  productTitle: string;
  productDescription?: string;
}

export const ShareButton = ({ productTitle, productDescription }: ShareButtonProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    // Verificar si la Web Share API está disponible
    setCanShare(typeof navigator !== 'undefined' && 'share' in navigator);
    
    // Obtener la URL completa
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const shareText = `${productTitle}${productDescription ? ` - ${productDescription}` : ''}`;

  const handleNativeShare = async () => {
    if (!canShare || !currentUrl) return;

    try {
      await navigator.share({
        title: productTitle,
        text: shareText,
        url: currentUrl,
      });
      setShowMenu(false);
    } catch (error) {
      // El usuario canceló o hubo un error
      if ((error as Error).name !== 'AbortError') {
        console.error('Error al compartir:', error);
      }
    }
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${currentUrl}`)}`;
    window.open(whatsappUrl, '_blank');
    setShowMenu(false);
  };

  const handleInstagramShare = async () => {
    // Instagram no tiene una URL directa para compartir enlaces
    // Intentamos copiar el enlace al portapapeles para que el usuario lo pegue
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(currentUrl);
        alert('Enlace copiado al portapapeles. Pégalo en Instagram.');
      } else {
        // Fallback: mostrar el enlace para copiar manualmente
        prompt('Copia este enlace para compartir en Instagram:', currentUrl);
      }
    } catch (error) {
      console.error('Error al copiar:', error);
      prompt('Copia este enlace para compartir en Instagram:', currentUrl);
    }
    setShowMenu(false);
  };

  const handleCopyLink = async () => {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(currentUrl);
        alert('Enlace copiado al portapapeles');
      } catch (error) {
        console.error('Error al copiar:', error);
      }
    } else {
      // Fallback para navegadores antiguos
      const textArea = document.createElement('textarea');
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Enlace copiado al portapapeles');
      } catch (error) {
        console.error('Error al copiar:', error);
      }
      document.body.removeChild(textArea);
    }
    setShowMenu(false);
  };

  // Si la Web Share API está disponible, usar el botón nativo
  if (canShare) {
    return (
      <button
        onClick={handleNativeShare}
        className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        aria-label="Compartir producto"
      >
        <IoShareSocialOutline size={20} />
        <span className="text-sm font-medium">Compartir</span>
      </button>
    );
  }

  // Si no está disponible, mostrar menú con opciones
  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        aria-label="Compartir producto"
      >
        <IoShareSocialOutline size={20} />
        <span className="text-sm font-medium">Compartir</span>
      </button>

      {showMenu && (
        <>
          {/* Overlay para cerrar el menú */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menú de opciones */}
          <div className="absolute right-0 top-full mt-2 bg-white border border-gray-300 rounded-md shadow-lg z-20 min-w-[200px]">
            <div className="p-2">
              <button
                onClick={handleWhatsAppShare}
                className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
              >
                <IoLogoWhatsapp size={24} className="text-green-600" />
                <span className="text-sm font-medium">WhatsApp</span>
              </button>
              
              <button
                onClick={handleInstagramShare}
                className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
              >
                <IoLogoInstagram size={24} className="text-pink-600" />
                <span className="text-sm font-medium">Instagram</span>
              </button>
              
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
              >
                <IoCopyOutline size={24} className="text-gray-600" />
                <span className="text-sm font-medium">Copiar enlace</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

