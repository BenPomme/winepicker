import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { Wine } from '../utils/types';
import RatingStars from './RatingStars';
import WineRating from './WineRating';
import { useAuth } from '../utils/authContext';

interface WineListCompactProps {
  wines: Wine[];
  onRemoveWine: (wineId: string | undefined) => void;
  onFetchPrice?: (wineId: string | undefined) => void;
  userProfile?: any;
}

const WineListCompact: React.FC<WineListCompactProps> = ({ 
  wines, 
  onRemoveWine, 
  onFetchPrice,
  userProfile
}) => {
  const { t } = useTranslation('common');
  const { currentUser } = useAuth();
  const [expandedWineId, setExpandedWineId] = useState<string | null>(null);
  
  // Toggle expanded state for a wine
  const toggleExpand = (wineId: string | undefined) => {
    if (!wineId) return;
    setExpandedWineId(expandedWineId === wineId ? null : wineId);
  };

  // Format wine type as a color class
  const getWineTypeColor = (type?: string): string => {
    if (!type) return 'bg-gray-200';
    
    type = type.toLowerCase();
    if (type.includes('red')) return 'bg-red-100 text-red-800';
    if (type.includes('white')) return 'bg-yellow-100 text-yellow-800';
    if (type.includes('rosé') || type.includes('rose')) return 'bg-pink-100 text-pink-800';
    if (type.includes('sparkling')) return 'bg-blue-100 text-blue-800';
    if (type.includes('dessert')) return 'bg-amber-100 text-amber-800';
    if (type.includes('fortified')) return 'bg-orange-100 text-orange-800';
    
    return 'bg-gray-100 text-gray-800';
  };

  if (wines.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      {/* Table Header */}
      <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-12 py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
        <div className="col-span-6 md:col-span-5">Wine</div>
        <div className="col-span-2 hidden md:block">Vintage</div>
        <div className="col-span-3 md:col-span-2">Rating</div>
        <div className="col-span-3 md:col-span-3 text-right">Actions</div>
      </div>
      
      {/* Wine List */}
      <div className="divide-y divide-gray-200">
        {wines.map((wine) => {
          const isExpanded = expandedWineId === wine.id;
          return (
            <div key={wine.id} className="hover:bg-gray-50 transition-colors">
              {/* Main Row - Always visible */}
              <div className="grid grid-cols-12 items-center p-3 cursor-pointer" onClick={() => toggleExpand(wine.id)}>
                {/* Wine Info */}
                <div className="col-span-6 md:col-span-5">
                  <div className="flex items-center">
                    {/* Wine Thumbnail */}
                    <div className="flex-shrink-0 h-12 w-12 bg-gray-100 rounded-md overflow-hidden mr-3">
                      <img 
                        className="h-full w-full object-cover" 
                        src={wine.imageUrl || "/placeholder-wine.jpg"} 
                        alt={wine.name || ''}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder-wine.jpg";
                        }}
                      />
                    </div>
                    
                    {/* Wine Name & Producer */}
                    <div className="truncate">
                      <div className="font-medium text-sm text-gray-900 truncate" title={wine.name}>
                        {wine.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate" title={wine.winery || wine.producer}>
                        {wine.winery || wine.producer}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Vintage */}
                <div className="hidden md:block col-span-2 text-sm text-gray-500">
                  {wine.year || wine.vintage || '—'}
                </div>
                
                {/* Rating */}
                <div className="col-span-3 md:col-span-2">
                  <div className="flex items-center">
                    <RatingStars rating={wine.score || 0} size="xs" />
                    <span className="ml-1 text-xs text-gray-500">
                      {wine.score || '—'}
                    </span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="col-span-3 md:col-span-3 flex justify-end items-center gap-1">
                  {/* Price Estimate Button */}
                  {currentUser && onFetchPrice && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFetchPrice(wine.id);
                      }}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center"
                      disabled={(wine as any).isPriceFetching}
                      aria-label={t('myList.fetchPrice', 'Fetch retail price')}
                    >
                      {(wine as any).isPriceFetching ? (
                        <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1"></span>
                      ) : (
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      <span className="hidden md:inline">
                        {(wine as any).isPriceFetching 
                          ? t('myList.fetchingPrice', 'Fetching...') 
                          : t('myList.fetchPrice', 'Price')}
                      </span>
                    </button>
                  )}
                  
                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveWine(wine.id);
                    }}
                    className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded flex items-center"
                    aria-label={t('myList.remove', 'Remove')}
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="hidden md:inline">{t('myList.remove', 'Remove')}</span>
                  </button>
                  
                  {/* Expand/Collapse Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(wine.id);
                    }}
                    className="text-xs px-2 py-1 text-primary hover:bg-primary-50 rounded"
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    <svg 
                      className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'transform rotate-180' : ''}`}
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Expanded Details - Conditionally visible */}
              {isExpanded && (
                <div className="p-4 border-t border-gray-100 bg-gray-50 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      {/* Additional Wine Details */}
                      <div className="grid grid-cols-2 gap-2">
                        {wine.region && (
                          <div>
                            <span className="font-medium text-gray-700">{t('wineDetails.region')}:</span>{' '}
                            <span className="text-gray-600">{wine.region}</span>
                          </div>
                        )}
                        
                        {(wine.grapeVariety || wine.varietal) && (
                          <div>
                            <span className="font-medium text-gray-700">{t('wineDetails.varietal')}:</span>{' '}
                            <span className="text-gray-600">{wine.grapeVariety || wine.varietal}</span>
                          </div>
                        )}
                        
                        {wine.type && (
                          <div>
                            <span className="font-medium text-gray-700">{t('wineDetails.type')}:</span>{' '}
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getWineTypeColor(wine.type)}`}>
                              {wine.type}
                            </span>
                          </div>
                        )}
                        
                        {wine.priceEstimate && (
                          <div>
                            <span className="font-medium text-gray-700">{t('wineDetails.estPrice')}:</span>{' '}
                            <span className="text-green-600 font-medium">
                              {wine.priceEstimate.currency} {wine.priceEstimate.price.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* User Rating */}
                      {currentUser && (
                        <div className="mt-4">
                          <div className="font-medium text-gray-700 mb-1">{t('wineDetails.yourRating')}:</div>
                          <div className="flex items-center">
                            {/* Use the WineRating component that supports interaction */}
                            {wine.id && (
                              <WineRating
                                wineId={wine.id}
                                initialRating={wine.userRating || 0}
                              />
                            )}
                            <span className="ml-2 text-sm text-gray-500">
                              {wine.userRating ? `${wine.userRating}/5` : t('wineDetails.notRated')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Wine Summary */}
                    {wine.summary && (
                      <div>
                        <div className="font-medium text-gray-700 mb-1">{t('wineDetails.summary')}:</div>
                        <p className="text-gray-600 text-sm line-clamp-4">{wine.summary}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Date Added */}
                  {wine.dateAdded && (
                    <div className="mt-4 text-xs text-gray-500">
                      {t('wineDetails.addedOn')}: {new Date(wine.dateAdded).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WineListCompact;