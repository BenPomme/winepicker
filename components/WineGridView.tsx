import React from 'react';
import { useTranslation } from 'next-i18next';
import { Wine } from '../utils/types';
import RatingStars from './RatingStars';
import WineRating from './WineRating';
import { useAuth } from '../utils/authContext';

interface WineGridViewProps {
  wines: Wine[];
  onRemoveWine: (wineId: string | undefined) => void;
  onFetchPrice?: (wineId: string | undefined) => void;
  userProfile?: any;
}

const WineGridView: React.FC<WineGridViewProps> = ({ 
  wines, 
  onRemoveWine, 
  onFetchPrice,
  userProfile
}) => {
  const { t } = useTranslation('common');
  const { currentUser } = useAuth();

  if (wines.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {wines.map((wine) => (
        <div 
          key={wine.id} 
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow animate-scale-in"
        >
          {/* Wine Image */}
          <div className="relative h-32 bg-gray-100">
            <img 
              className="h-full w-full object-cover" 
              src={wine.imageUrl || "/placeholder-wine.jpg"} 
              alt={wine.name || ''}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder-wine.jpg";
              }}
            />
            
            {/* Quick Action Buttons - Positioned absolute on the image */}
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                onClick={() => onRemoveWine(wine.id)}
                className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white text-red-600 shadow-sm"
                aria-label={t('myList.remove', 'Remove')}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Wine Details */}
          <div className="p-3">
            <div className="mb-2">
              <h3 className="font-medium text-sm line-clamp-1" title={wine.name}>
                {wine.name}
              </h3>
              <p className="text-xs text-gray-500 line-clamp-1" title={wine.winery || wine.producer}>
                {wine.winery || wine.producer}
              </p>
            </div>
            
            {/* Badges */}
            <div className="flex flex-wrap gap-1 mb-2">
              {wine.year || wine.vintage ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">
                  {wine.year || wine.vintage}
                </span>
              ) : null}
              
              {wine.region ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">
                  {wine.region}
                </span>
              ) : null}
            </div>
            
            {/* Rating & Price */}
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <RatingStars rating={wine.score || 0} size="xs" />
                <span className="ml-1 text-xs text-gray-600">
                  {wine.score || '—'}
                </span>
              </div>
              
              {wine.priceEstimate && (
                <span className="text-xs font-medium text-green-600">
                  {wine.priceEstimate.currency} {wine.priceEstimate.price.toFixed(2)}
                </span>
              )}
            </div>
            
            {/* Bottom Actions */}
            <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
              {/* User Rating */}
              {currentUser ? (
                <div className="flex items-center">
                  {wine.id && (
                    <WineRating
                      wineId={wine.id}
                      initialRating={wine.userRating || 0}
                    />
                  )}
                </div>
              ) : (
                <span className="text-xs text-gray-400">{t('wineDetails.notRated')}</span>
              )}
              
              {/* Price Fetch Button */}
              {currentUser && onFetchPrice && !wine.priceEstimate && (
                <button
                  onClick={() => onFetchPrice(wine.id)}
                  className="text-xs py-1 px-2 text-primary hover:bg-primary-50 rounded-md"
                  disabled={(wine as any).isPriceFetching}
                >
                  {(wine as any).isPriceFetching ? (
                    <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  ) : t('myList.fetchPrice', 'Fetch Price')}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WineGridView;