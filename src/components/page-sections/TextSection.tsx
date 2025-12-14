interface TextSectionProps {
  content: {
    title?: string;
    content?: string;
  };
}

export const TextSection = ({ content }: TextSectionProps) => {
  return (
    <section 
      className="w-full py-12 px-4"
      style={{
        backgroundColor: 'var(--theme-primary-color)',
      }}
    >
      <div className="max-w-4xl mx-auto">
        {content.title && (
          <h2 className="text-3xl font-bold mb-6 text-gray-900">{content.title}</h2>
        )}
        {content.content && (
          <div
            className="prose prose-lg max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: content.content.replace(/\n/g, '<br />') }}
          />
        )}
      </div>
    </section>
  );
};
