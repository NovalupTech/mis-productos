import Image from 'next/image';

interface ImageSectionProps {
  content: {
    image?: string;
    alt?: string;
    caption?: string;
  };
}

export const ImageSection = ({ content }: ImageSectionProps) => {
  if (!content.image) return null;

  return (
    <section 
      className="w-full py-8 px-4"
      style={{
        backgroundColor: 'var(--theme-primary-color)',
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="relative w-full aspect-video rounded-lg overflow-hidden">
          <Image
            src={content.image}
            alt={content.alt || 'Imagen'}
            fill
            className="object-cover"
          />
        </div>
        {content.caption && (
          <p className="text-center text-gray-600 mt-4 italic">{content.caption}</p>
        )}
      </div>
    </section>
  );
};
