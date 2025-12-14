interface FeaturesSectionProps {
  content: {
    title?: string;
    features?: string[] | string;
  };
}

export const FeaturesSection = ({ content }: FeaturesSectionProps) => {
  let features: string[] = [];
  
  if (Array.isArray(content.features)) {
    features = content.features;
  } else if (typeof content.features === 'string') {
    try {
      features = JSON.parse(content.features);
    } catch {
      features = [];
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-lg shadow-sm border border-gray-200"
              style={{
                backgroundColor: 'var(--theme-primary-color)',
              }}
            >
              <p className="text-gray-700">{feature}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
