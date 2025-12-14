'use client';

import Link from 'next/link';

interface CTASectionProps {
  content: {
    title?: string;
    description?: string;
    buttonText?: string;
    buttonLink?: string;
  };
}

export const CTASection = ({ content }: CTASectionProps) => {
  return (
    <section 
      className="w-full py-16 px-4 text-white"
      style={{
        backgroundColor: 'var(--theme-secondary-color)',
      }}
    >
      <div className="max-w-4xl mx-auto text-center">
        {content.title && (
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{content.title}</h2>
        )}
        {content.description && (
          <p className="text-xl mb-8 opacity-90">{content.description}</p>
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
