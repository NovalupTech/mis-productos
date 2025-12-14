import Image from 'next/image';

interface GallerySectionProps {
  content: {
    title?: string;
    images?: string[] | string;
  };
}

export const GallerySection = ({ content }: GallerySectionProps) => {
  let images: string[] = [];
  
  if (Array.isArray(content.images)) {
    images = content.images;
  } else if (typeof content.images === 'string') {
    try {
      images = JSON.parse(content.images);
    } catch {
      images = [];
    }
  }

  return (
    <section 
      className="w-full py-12 px-4"
      style={{
        backgroundColor: 'var(--theme-primary-color)',
      }}
    >
      <div className="max-w-6xl mx-auto">
        {content.title && (
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">{content.title}</h2>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative w-full aspect-square rounded-lg overflow-hidden"
            >
              <Image
                src={image}
                alt={`Imagen ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
