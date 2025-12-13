'use client';

import { useEffect, useState } from 'react';

interface CalendlyButtonProps {
  className?: string;
  children: React.ReactNode;
}

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
    };
  }
}

export default function CalendlyButton({ className, children }: CalendlyButtonProps) {
  const [isCalendlyLoaded, setIsCalendlyLoaded] = useState(false);

  useEffect(() => {
    // Verificar si el script ya está cargado
    const existingScript = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]');
    const existingLink = document.querySelector('link[href="https://assets.calendly.com/assets/external/widget.css"]');

    if (existingScript && existingLink) {
      setIsCalendlyLoaded(true);
      return;
    }

    // Cargar el CSS de Calendly
    if (!existingLink) {
      const link = document.createElement('link');
      link.href = 'https://assets.calendly.com/assets/external/widget.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    // Cargar el script de Calendly
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = () => {
        setIsCalendlyLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      setIsCalendlyLoaded(true);
    }
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    if (isCalendlyLoaded && typeof window !== 'undefined' && window.Calendly) {
      window.Calendly.initPopupWidget({
        url: 'https://calendly.com/desarrollo-novalup/reunion-misproductos'
      });
    } else {
      // Si aún no está cargado, esperar un poco y reintentar
      setTimeout(() => {
        if (window.Calendly) {
          window.Calendly.initPopupWidget({
            url: 'https://calendly.com/desarrollo-novalup/reunion-misproductos'
          });
        }
      }, 500);
    }
  };

  return (
    <a href="#" onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
