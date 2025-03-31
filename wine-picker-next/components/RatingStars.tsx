import { useState } from 'react';

interface RatingStarsProps {
  rating: number;  // Rating should be between 0-100
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function RatingStars({ rating, onChange, size = 'md' }: RatingStarsProps) {
  const [hover, setHover] = useState<number | null>(null);
  
  // Convert 0-100 rating to 0-5 stars
  const starRating = Math.round((rating / 100) * 5);
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`${onChange ? 'cursor-pointer' : 'cursor-default'}`}
          onClick={() => onChange?.(star * 20)}
          onMouseEnter={() => onChange && setHover(star)}
          onMouseLeave={() => onChange && setHover(null)}
        >
          <svg
            className={`${sizeClasses[size]} ${
              (hover || starRating) >= star
                ? 'text-primary'
                : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
        </button>
      ))}
      {onChange && (
        <span className="text-sm text-secondary ml-2">
          {hover ? `${hover * 20}%` : `${rating}%`}
        </span>
      )}
    </div>
  );
} 