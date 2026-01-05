'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IoChevronBackOutline, IoChevronForwardOutline } from 'react-icons/io5';

interface SliderImage {
  url: string;
  link?: string;
  openInNewTab?: boolean;
}

interface SliderSectionProps {
  content: Record<string, unknown>;
  config?: Record<string, unknown> | null;
}

export const SliderSection = ({ content, config }: SliderSectionProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [images, setImages] = useState<SliderImage[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Obtener width y height del config, con valores por defecto
  const width = (config?.width as string) || '100%';
  const height = (config?.height as string) || '500px';
  // Obtener tiempo de transición (en segundos, convertir a milisegundos)
  const transitionTimeSeconds = Number(config?.transitionTime) || 5;
  const transitionTimeMs = transitionTimeSeconds * 1000;

  useEffect(() => {
    let parsedImages: SliderImage[] = [];
    
    if (Array.isArray(content.images)) {
      // Convertir array de strings a array de objetos con estructura SliderImage
      parsedImages = content.images.map((item) => {
        if (typeof item === 'string') {
          // Formato antiguo: solo URL
          return { url: item };
        } else if (typeof item === 'object' && item !== null) {
          // Formato nuevo: objeto con url, link, openInNewTab
          const img = item as Record<string, unknown>;
          return {
            url: (img.url as string) || '',
            link: img.link as string | undefined,
            openInNewTab: img.openInNewTab === true || img.openInNewTab === 'true',
          };
        }
        return { url: '' };
      }).filter(img => img.url);
    } else if (typeof content.images === 'string') {
      try {
        const parsed = JSON.parse(content.images);
        if (Array.isArray(parsed)) {
          parsedImages = parsed.map((item) => {
            if (typeof item === 'string') {
              return { url: item };
            } else if (typeof item === 'object' && item !== null) {
              const img = item as Record<string, unknown>;
              return {
                url: (img.url as string) || '',
                link: img.link as string | undefined,
                openInNewTab: img.openInNewTab === true || img.openInNewTab === 'true',
              };
            }
            return { url: '' };
          }).filter(img => img.url);
        }
      } catch {
        parsedImages = [];
      }
    }

    setImages(parsedImages);
  }, [content.images]);

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setTimeout(() => setIsTransitioning(false), 500); // Duración de la transición
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setTimeout(() => setIsTransitioning(false), 500); // Duración de la transición
  };

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500); // Duración de la transición
  };

  // Auto-play del slider con tiempo configurado
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      if (!isTransitioning) {
        setIsTransitioning(true);
        setCurrentIndex((prev) => (prev + 1) % images.length);
        setTimeout(() => setIsTransitioning(false), 500);
      }
    }, transitionTimeMs);

    return () => clearInterval(interval);
  }, [images.length, transitionTimeMs, isTransitioning]);

  if (images.length === 0) {
    return null;
  }

  return (
    <section className="relative w-full overflow-hidden" style={{ width, height }}>
      {/* Contenedor de imágenes con efecto slide */}
      <div 
        className="flex h-full transition-transform duration-500 ease-in-out"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
      >
        {images.map((image, index) => {
          const ImageContent = (
            <Image
              key={index}
              src={image.url}
              alt={`Slider ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
            />
          );

          return (
            <div
              key={index}
              className="relative flex-shrink-0 h-full w-full"
            >
              {image.link ? (
                <Link
                  href={image.link}
                  target={image.openInNewTab ? '_blank' : '_self'}
                  rel={image.openInNewTab ? 'noopener noreferrer' : undefined}
                  className="block w-full h-full cursor-pointer"
                >
                  {ImageContent}
                </Link>
              ) : (
                ImageContent
              )}
            </div>
          );
        })}
      </div>

      {/* Controles de navegación */}
      {images.length > 1 && (
        <>
          {/* Botón anterior */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            <button
              onClick={prevSlide}
              className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors flex items-center justify-center w-10 h-10"
              aria-label="Imagen anterior"
            >
              <IoChevronBackOutline size={24} />
            </button>
          </div>

          {/* Botón siguiente */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
            <button
              onClick={nextSlide}
              className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors flex items-center justify-center w-10 h-10"
              aria-label="Imagen siguiente"
            >
              <IoChevronForwardOutline size={24} />
            </button>
          </div>

          {/* Indicadores de posición */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Ir a imagen ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};
