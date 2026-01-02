'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { IoCloseOutline, IoChevronBackOutline, IoChevronForwardOutline } from 'react-icons/io5';

interface ImageModalProps {
  isOpen: boolean;
  images: string[];
  currentIndex: number;
  title: string;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const ImageModal = ({ isOpen, images, currentIndex, title, onClose, onNext, onPrevious }: ImageModalProps) => {
  // Cerrar con ESC y navegar con flechas
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        onPrevious();
      } else if (e.key === 'ArrowRight') {
        onNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNext, onPrevious]);

  // Prevenir scroll del body cuando el modal está abierto
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

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const imageUrl = currentImage.startsWith('http') || currentImage.startsWith('https') 
    ? currentImage 
    : `/products/${currentImage}`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Botón cerrar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        aria-label="Cerrar"
      >
        <IoCloseOutline size={28} className="text-white" />
      </button>

      {/* Botón anterior */}
      {images.length > 1 && currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Imagen anterior"
        >
          <IoChevronBackOutline size={24} className="text-white" />
        </button>
      )}

      {/* Botón siguiente */}
      {images.length > 1 && currentIndex < images.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Imagen siguiente"
        >
          <IoChevronForwardOutline size={24} className="text-white" />
        </button>
      )}

      {/* Imagen */}
      <div 
        className="relative max-w-[90vw] max-h-[90vh] w-full h-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={imageUrl}
          alt={title}
          width={1200}
          height={1200}
          className="object-contain max-w-full max-h-full rounded-lg"
          priority
        />
      </div>

      {/* Indicador de imagen */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
          <span className="text-white text-sm">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
      )}
    </div>
  );
};
