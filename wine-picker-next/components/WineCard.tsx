import { useState } from 'react';
import { Wine } from '../utils/types';
import ReviewSection from './ReviewSection';
import RatingStars from './RatingStars';

interface WineCardProps {
  wine: Wine;
  isFeatured?: boolean;
}

const WineCard = ({ wine, isFeatured = false }: WineCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Handle user rating change
  const handleRatingChange = (rating: number) => {
    console.log(`Rating changed to ${rating} for ${wine.name}`);
    // This would typically update state or call an API
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const getImageUrl = () => {
    if (imageError || !wine.imageUrl) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNODAgMTIwTDEwMCA4MEwxMjAgMTIwSDgwWiIgZmlsbD0iIzk0QTNCOCIvPjwvc3ZnPg==';
    }
    return wine.imageUrl;
  };

  return (
    <div className={`wine-card ${isFeatured ? 'p-6' : 'p-4'} glass-effect rounded-xl`}>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Wine Image */}
        <div className={`relative ${isFeatured ? 'w-48 h-48' : 'w-32 h-32'} flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden`}>
          <img
            src={getImageUrl()}
            alt={wine.name}
            className="w-full h-full object-contain rounded-lg"
            onError={handleImageError}
          />
        </div>

        {/* Wine Details */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className={`font-bold ${isFeatured ? 'text-xl' : 'text-lg'} text-background-dark`}>
              {wine.name}
            </h3>
            <div className="flex items-center space-x-1">
              <span className="text-primary font-semibold">{wine.rating.score}%</span>
              <span className="text-secondary text-sm">({wine.rating.source})</span>
            </div>
          </div>

          {/* Wine Pills */}
          <div className="flex flex-wrap gap-2 mb-3">
            {wine.year && (
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                {wine.year}
              </span>
            )}
            {wine.region && (
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                {wine.region}
              </span>
            )}
            {wine.grapeVariety && (
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                {wine.grapeVariety}
              </span>
            )}
            {wine.type && (
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                {wine.type}
              </span>
            )}
          </div>

          {/* Rating Stars */}
          <div className="flex items-center mb-3">
            <RatingStars rating={wine.rating.score} size="md" />
          </div>

          {/* AI Summary */}
          {wine.aiSummary && (
            <div className="mb-4">
              <p className="text-background-dark italic">
                "{wine.aiSummary}"
              </p>
            </div>
          )}

          {/* Reviews Section */}
          {(wine.rating.review || (wine.additionalReviews && wine.additionalReviews.length > 0)) && (
            <div className="space-y-3">
              {/* Main Review */}
              {wine.rating.review && (
                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-sm text-secondary">{wine.rating.review}</p>
                </div>
              )}

              {/* Additional Reviews */}
              {wine.additionalReviews && wine.additionalReviews.length > 0 && (
                <div className="space-y-2">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-primary text-sm font-medium hover:text-primary-light transition-colors"
                  >
                    {isExpanded ? 'Hide Reviews' : `Show ${wine.additionalReviews.length} More Reviews`}
                  </button>
                  {isExpanded && (
                    <div className="space-y-2">
                      {wine.additionalReviews.map((review, index) => (
                        <div key={index} className="bg-white/50 rounded-lg p-3">
                          <p className="text-sm text-secondary">
                            {typeof review === 'string' ? review : review.review || review.text || ''}
                          </p>
                          {typeof review === 'object' && review.source && (
                            <p className="text-xs text-secondary mt-1">Source: {review.source}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WineCard; 