import React, { useState, useEffect } from 'react';
import { Wine, UserPreferences, WineRecommendation } from '../utils/types';
import WineCard from './WineCard';
import PreferenceSelector from './PreferenceSelector';
import { getWineRecommendations } from '../utils/recommendation';

interface WineListProps {
  wines: Wine[];
  isRestaurantMenu?: boolean;
  onAddToList?: (wine: Wine) => void;
  onRemoveFromList?: (wineId: string) => void;
}

const WineList: React.FC<WineListProps> = ({ wines, isRestaurantMenu = false, onAddToList, onRemoveFromList }) => {
  const [expandedWineId, setExpandedWineId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<WineRecommendation[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    pairingType: '',
    preferredStyle: '',
    maxPrice: undefined
  });
  const [showPreferences, setShowPreferences] = useState(isRestaurantMenu || wines.length > 1);

  // Generate a unique ID for each wine if it doesn't have one
  const winesWithId = wines.map((wine, index) => ({
    ...wine,
    id: wine.id || `wine-${index}-${wine.name?.replace(/\s+/g, '-').toLowerCase() || 'unknown'}`
  }));

  // Update recommendations when wines or preferences change
  useEffect(() => {
    if (wines.length > 0) {
      const newRecommendations = getWineRecommendations(winesWithId, preferences);
      setRecommendations(newRecommendations);
      
      // Auto-expand the top recommendation if none is expanded
      if (expandedWineId === null && newRecommendations.length > 0 && newRecommendations[0].wine.id) {
        setExpandedWineId(newRecommendations[0].wine.id);
      }
    }
  }, [wines, preferences]);

  // Toggle expanded wine details
  const toggleExpand = (wineId: string) => {
    setExpandedWineId(expandedWineId === wineId ? null : wineId);
  };

  // Handle preference changes
  const handlePreferenceChange = (newPreferences: UserPreferences) => {
    setPreferences(newPreferences);
  };

  // If no wines, show empty state
  if (!wines || wines.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No wine information available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preference toggle for multiple wines */}
      {wines.length > 1 && (
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            {isRestaurantMenu ? 'Wine Menu Analysis' : `Found ${wines.length} Wines`}
          </h2>
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-md shadow-sm flex items-center"
          >
            {showPreferences ? 'Hide Preferences' : 'Show Preferences'}
            <svg
              className={`ml-1 w-4 h-4 transform ${showPreferences ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
        </div>
      )}

      {/* Preference selector */}
      {showPreferences && (
        <PreferenceSelector 
          preferences={preferences} 
          onChange={handlePreferenceChange}
          showTitle={wines.length > 1} 
        />
      )}

      {/* Wine list */}
      <div className="space-y-4">
        {recommendations.map((recommendation) => {
          const wine = recommendation.wine;
          const isExpanded = wine.id === expandedWineId;
          const isTopRecommendation = recommendations[0]?.wine.id === wine.id;
          
          return (
            <div key={wine.id} className="transition-all duration-200">
              {/* Compact card (collapsed view) */}
              {!isExpanded && (
                <div 
                  className={`p-4 bg-white shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow
                    ${isTopRecommendation ? 'border-l-4 border-purple-500' : ''}`}
                  onClick={() => wine.id && toggleExpand(wine.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      {/* Small wine thumbnail */}
                      <div className="w-12 h-12 flex-shrink-0 mr-4">
                        <img 
                          src={wine.imageUrl || '/placeholder-wine.jpg'} 
                          alt={wine.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = '/placeholder-wine.jpg';
                          }}
                        />
                      </div>
                      
                      {/* Wine basic info */}
                      <div>
                        <h3 className="font-medium text-gray-900">{wine.name}</h3>
                        <p className="text-sm text-gray-500">
                          {wine.producer || wine.winery}
                          {wine.vintage ? ` · ${wine.vintage}` : ''}
                          {wine.region ? ` · ${wine.region}` : ''}
                        </p>
                      </div>
                    </div>
                    
                    {/* Score and recommendation badge */}
                    <div className="text-right">
                      <div className="flex items-center">
                        {recommendation.matchScore > 85 && (
                          <span className="mr-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Recommended
                          </span>
                        )}
                        <span className="font-bold text-lg">
                          {wine.score || 'N/A'}<span className="text-xs text-gray-500">/100</span>
                        </span>
                      </div>
                      {wine.estimatedPrice && (
                        <p className="text-sm text-gray-600">{wine.estimatedPrice}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Expanded details */}
              {isExpanded && (
                <div className="relative">
                  {/* Close button for expanded view */}
                  <button
                    onClick={() => wine.id && toggleExpand(wine.id)}
                    className="absolute top-2 right-2 z-10 p-1 bg-white rounded-full shadow-sm hover:bg-gray-100"
                    aria-label="Close details"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                  
                  {/* Recommendation reasons */}
                  {recommendation.reasons.length > 0 && (
                    <div className="mb-2 p-3 bg-green-50 border border-green-100 rounded-lg">
                      <h4 className="text-sm font-medium text-green-800 mb-1">Why we recommend this wine:</h4>
                      <ul className="list-disc list-inside text-sm text-green-700">
                        {recommendation.reasons.map((reason, idx) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Full wine card */}
                  <WineCard 
                    wine={wine} 
                    isFeatured={isTopRecommendation}
                    onAddToList={onAddToList}
                    onRemoveFromList={onRemoveFromList}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WineList;