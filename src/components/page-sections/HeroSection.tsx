'use client';

import Image from 'next/image';
import Link from 'next/link';

interface HeroSectionProps {
  content: {
    title?: string;
    subtitle?: string;
    image?: string;
    buttonText?: string;
    buttonLink?: string;
  };
}

export const HeroSection = ({ content }: HeroSectionProps) => {
  return (
    <section 
      className="relative w-full h-[500px] flex items-center justify-center text-white"
      style={{
        backgroundColor: 'var(--theme-secondary-color)',
      }}
    >
      {content.image && (
        <div className="absolute inset-0 z-0">
          <Image
            src={content.image}
            alt={content.title || 'Hero'}
            fill
            className="object-cover opacity-30"
          />
        </div>
      )}
      <div className="relative z-10 text-center px-4 max-w-4xl">
        {content.title && (
          <h1 className="text-4xl md:text-6xl font-bold mb-4">{content.title}</h1>
        )}
        {content.subtitle && (
          <p className="text-xl md:text-2xl mb-8">{content.subtitle}</p>
        )}
        {content.buttonText && content.buttonLink && (
          <Link
            href={content.buttonLink}
            className="inline-block px-8 py-3 rounded-lg font-semibold transition-colors"
            style={{
              backgroundColor: 'var(--theme-primary-color)',
              color: 'var(--theme-secondary-color)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            {content.buttonText}
          </Link>
        )}
      </div>
    </section>
  );
};
