import Link from 'next/link';

interface BannerSectionProps {
  content: {
    text?: string;
    link?: string;
    backgroundColor?: string;
    textColor?: string;
  };
}

export const BannerSection = ({ content }: BannerSectionProps) => {
  const bgColor = content.backgroundColor || '#3B82F6';
  const textColor = content.textColor || '#FFFFFF';
  const baseClassName = "block w-full py-4 px-6 text-center";
  const style = { 
    backgroundColor: bgColor,
    color: textColor,
  };

  if (content.link) {
    return (
      <Link
        href={content.link}
        className={baseClassName}
        style={style}
      >
        {content.text && <p className="text-lg font-medium">{content.text}</p>}
      </Link>
    );
  }

  return (
    <div
      className={baseClassName}
      style={style}
    >
      {content.text && <p className="text-lg font-medium">{content.text}</p>}
    </div>
  );
};
