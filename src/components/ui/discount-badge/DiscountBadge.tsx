'use client';

interface DiscountBadgeProps {
  text: string;
  className?: string;
}

export const DiscountBadge = ({ text, className = '' }: DiscountBadgeProps) => {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold text-white ${className}`}
      style={{
        backgroundColor: '#ef4444', // red-500
      }}
    >
      {text}
    </span>
  );
};
