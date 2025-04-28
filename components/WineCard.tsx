import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { Wine } from '../utils/types';
import ReviewSection from './ReviewSection';
import RatingStars from './RatingStars';
import { addToPersonalList, removeFromPersonalList, isInPersonalList } from '../utils/personalWineList';
import { useAuth } from '../utils/authContext';

interface WineCardProps {
  wine: Wine & { 
    webSnippets?: string;
    noBSMode?: boolean;
    userRating?: number;
    priceEstimate?: {
      price: number;
      currency: string;
      confidence: 'high' | 'medium' | 'low';
      lastUpdated?: Date;
    };
  };
  isFeatured?: boolean;
  onAddToList?: (wine: Wine) => void;
  onRemoveFromList?: (wineId: string) => void;
  showWineRating?: boolean;
  wineRating?: React.ReactNode;
  priceActions?: React.ReactNode;
  displayPrice?: React.ReactNode;
}

// Placeholder SVG (Simple gray square)
const placeholderSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Crect width='10' height='10' fill='%23E5E7EB'/%3E%3C/svg%3E";


// Helper to parse snippets (assuming newline separated)
const parseWebSnippets = (snippetsText: string): { source: string, snippet: string }[] => {
    const defaultMessages = [
        'No specific web results found.',
        'Error during web search.',
        'Web search performed, but snippets require further processing.',
        'No snippets found on Vivino, Decanter, or Wine-Searcher.',
        'Failed to get snippets after tool call simulation.',
        'Error retrieving snippets after tool simulation.',
        'No relevant snippets found.',
        'No web results found.',
        'Error retrieving web snippets.',
        'No specific reviews found for this wine.',
        'No valid wine review sources found.'
    ];

    // Trim and check against default/error messages
    const trimmedText = snippetsText?.trim() || '';
    if (!trimmedText || defaultMessages.some(msg => trimmedText.includes(msg))) {
        console.log('No valid snippets found, returning empty array');
        return [];
    }
    
    // Split by newline and filter out empty/short lines
    const lines = trimmedText.split('\n').filter(line => line.trim().length > 10);
    console.log('Parsed snippet lines:', lines);
    
    // First pass - process all lines into potential source/snippet pairs
    let processedSnippets = lines.map((line, index) => {
        let source = `Source ${index + 1}`; // Default source
        let snippet = line.trim();

        // Try various patterns to extract source information
        
        // Pattern 1: "Source: Website - Snippet text"
        const sourcePattern1 = /^Source:\s*([^-:]+)[\s-:]+(.+)$/i;
        const match1 = snippet.match(sourcePattern1);
        if (match1 && match1[1] && match1[2]) {
            source = match1[1].trim();
            snippet = match1[2].trim();
        } else {
            // Pattern 2: "Website: Snippet text"
            const sourcePattern2 = /^([A-Za-z0-9\s.-]+):\s*(.+)$/;
            const match2 = snippet.match(sourcePattern2);
            if (match2 && match2[1] && match2[1].length < 30 && match2[2]) {
                source = match2[1].trim();
                snippet = match2[2].trim();
            } else {
                // Pattern 3: Look for known wine sites at the beginning
                const knownSites = ['Vivino', 'Wine-Searcher', 'Decanter', 'Wine Spectator', 'Wine Enthusiast', 'Wine.com', 'Cellar Tracker'];
                for (const site of knownSites) {
                    if (snippet.startsWith(site) && snippet.substring(site.length).match(/^[\s:-]/)) {
                        const afterSite = snippet.substring(site.length).replace(/^[\s:-]+/, '');
                        if (afterSite.length > 10) { // Make sure we have actual content
                            source = site;
                            snippet = afterSite;
                            break;
                        }
                    }
                }
            }
        }
        
        // Clean up the snippet text
        // Remove leading/trailing quotes
        snippet = snippet.replace(/^["'\s]+|["'\s]+$/g, '');
        // Remove leading dash (common in markdown lists)
        snippet = snippet.replace(/^-\s+/, '');
        // Remove URLs in parentheses and brackets
        snippet = snippet.replace(/\(\[(.*?)\]\(.*?\)\)/g, ''); // Remove markdown style links
        snippet = snippet.replace(/\(\[.*?\]\)/g, ''); // Remove links in brackets
        snippet = snippet.replace(/\(https?:\/\/.*?\)/g, ''); // Remove direct URLs
        snippet = snippet.replace(/\[.*?\]\(.*?\)/g, ''); // Remove markdown style links without parentheses
        // Remove common artifacts
        snippet = snippet.replace(/\[Extracted from HTML\]/gi, '');
        
        // Clean up the source
        let cleanedSource = source.trim();
        // Remove ** markdown formatting
        cleanedSource = cleanedSource.replace(/\*\*/g, '');
        // Remove markdown dash/bullet at the beginning
        cleanedSource = cleanedSource.replace(/^[\s-]*/, '');
        // Remove domain extensions
        cleanedSource = cleanedSource.replace(/\.(com|org|net|io|co|us|edu|es)$/i, '');
        // Remove common prefixes
        cleanedSource = cleanedSource.replace(/^(Source|Review|From):?\s*/i, '');
        // Remove number suffixes (like Source 1)
        cleanedSource = cleanedSource.replace(/\s+\d+$/, '');
        
        return { 
            source: cleanedSource, 
            snippet,
            originalLine: line.trim(),
            id: index
        };
    });
    
    // Filter out AI commentary, empty entries, and useless snippets
    processedSnippets = processedSnippets.filter(entry => {
        // Skip entries with "Source" followed by a number as the source
        if (/^Source\s+\d+$/i.test(entry.source)) return false;
        
        // Skip entries with "Review" followed by a number as the source
        if (/^Review\s+\d+$/i.test(entry.source)) return false;
        
        // Skip if content is too short
        if (entry.snippet.length < 15) return false;
        
        // Skip items that are clearly AI commentary
        const aiCommentaryIndicators = [
            'I searched', 'I could not find', 'I found', 'While specific', 
            'specific reviews', 'Unfortunately', 'unable to find',
            'no specific reviews', 'here are', 'these insights',
            'provide an overview', 'additional information', 'may provide',
            'pertain to', 'similar wines', 'couldn\'t locate', 'similar characteristics',
            'couldn\'t find', 'don\'t have', 'not available', 'no information'
        ];
        
        if (aiCommentaryIndicators.some(phrase => 
            entry.snippet.toLowerCase().includes(phrase.toLowerCase()))) {
            return false;
        }
        
        return true;
    });
    
    // Always remove first and last entries as they consistently contain
    // AI introduction and conclusion
    if (processedSnippets.length > 2) {
        processedSnippets = processedSnippets.slice(1, -1);
    }
    
    // Additional filter to catch entries that look like headings or labels
    processedSnippets = processedSnippets.filter(entry => {
        // Skip entries that are just headers (short phrases surrounded by ** or just names)
        if (entry.snippet.trim().length < 50 && 
            (entry.snippet.includes('**') || 
             !entry.snippet.includes(' ') ||
             !/[,.!?]/.test(entry.snippet))) {
            return false;
        }
        
        // Also filter out entries with source names like "Source X" or "Review X"
        if (/^(Source|Review)\s+\d+$/i.test(entry.source)) {
            return false;
        }
        
        return true;
    });
    
    console.log(`Final snippets count after filtering: ${processedSnippets.length}`);
    
    // Limit to maximum 5 snippets to avoid overwhelming the UI
    if (processedSnippets.length > 5) {
        processedSnippets = processedSnippets.slice(0, 5);
    }
    
    // Format the snippets for display
    return processedSnippets.map(entry => {
        // Add quotes if they're not already there
        let displaySnippet = entry.snippet;
        if (!displaySnippet.startsWith('"') && !displaySnippet.endsWith('"')) {
            displaySnippet = `"${displaySnippet}"`;
        }
        
        return { 
            source: entry.source,
            snippet: displaySnippet
        };
    });
};

const WineCard: React.FC<WineCardProps> = ({ 
  wine, 
  isFeatured, 
  onAddToList, 
  onRemoveFromList,
  showWineRating,
  wineRating,
  priceActions,
  displayPrice
}) => {
  const { t } = useTranslation('common');
  const { currentUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [isInList, setIsInList] = useState(false);
  const [showWebReviews, setShowWebReviews] = useState(false);
  const [addingToList, setAddingToList] = useState(false);
  
  // Check if the wine is already in the personal list
  useEffect(() => {
    const checkIfInList = async () => {
      const result = await isInPersonalList(wine);
      setIsInList(result);
    };
    
    checkIfInList();
  }, [wine]);
  
  const webSnippets = parseWebSnippets(wine.webSnippets || '');

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
  
  // State for error messages
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Handle adding/removing from personal list
  const handleTogglePersonalList = async () => {
    if (addingToList) return; // Prevent multiple clicks
    
    setErrorMessage(''); // Clear any previous error
    setAddingToList(true);
    
    try {
      if (isInList) {
        if (wine.id) {
          // Set isInList to false first for immediate UI feedback
          setIsInList(false);
          
          // If we have a callback, call it before the API
          // This helps the parent component update its state immediately
          if (onRemoveFromList) {
            onRemoveFromList(wine.id);
          }
          
          // Now do the actual removal operation in the background
          // This avoids having the UI wait for the response
          // We don't care about the return value, as we've already updated the UI
          try {
            await removeFromPersonalList(wine.id, currentUser?.uid);
          } catch (removeError) {
            console.error('Error in background removal operation:', removeError);
            // If the removal fails, we don't change the UI since we've already updated it
          }
        }
      } else {
        // Add to list
        try {
          await addToPersonalList(wine, currentUser?.uid);
          setIsInList(true);
          if (onAddToList) {
            onAddToList(wine);
          }
        } catch (addError) {
          // For adding, errors need to be shown to the user
          throw addError;
        }
      }
    } catch (error) {
      console.error('Error toggling wine in personal list:', error);
      const message = error instanceof Error && error.message.includes('Maximum number') 
        ? t('myList.maxWinesReached', 'Maximum number of wines reached')
        : t('myList.errorAdding', 'Error adding wine');
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setAddingToList(false);
    }
  };

  return (
    <div className={`wine-card animate-scale-in ${wine.noBSMode ? 'bg-background-dark text-white' : 'bg-surface'} 
      ${isFeatured ? `ring-2 ring-offset-2 ${wine.noBSMode ? 'ring-error' : 'ring-primary'}` : ''}`}>
      <div className="flex h-full">
        {/* Image Section - Smaller to make more compact */}
        <div className={`flex-shrink-0 p-3 flex items-center justify-center w-1/4 relative 
          ${wine.noBSMode ? 'border-r border-gray-700' : ''}`}>
          {/* Wine image with more compact styling */}
          <div className="relative overflow-hidden rounded-lg shadow-md">
            <img 
              className="h-28 w-full object-cover transform transition-transform duration-500 hover:scale-105" 
              src={wine.imageUrl || "/placeholder-wine.jpg"}
              onError={handleImageError}
              alt={`${wine.winery || wine.producer || ''} ${wine.name || ''}`}
            />
            {isFeatured && (
              <div className={`absolute top-1 right-1 ${wine.noBSMode ? 'badge-accent' : 'badge-primary'} badge badge-sm`}>
                {t('featured', 'Featured')}
              </div>
            )}
          </div>
        </div>

        {/* Details Section - More compact */}
        <div className="p-3 flex-grow">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className={`uppercase tracking-wide text-xs font-display font-semibold 
                ${wine.noBSMode ? 'text-error' : 'text-primary'}`}>
                {wine.winery || wine.producer || t('wineDetails.producer')}
              </div>
              <h2 className={`block mt-0.5 text-lg leading-tight font-display 
                ${wine.noBSMode ? 'text-white' : 'text-text-primary'}`}>
                {wine.name || t('wineDetails.name')}
              </h2>
              <div className="mt-1 flex flex-wrap gap-1">
                {wine.year || wine.vintage ? (
                  <span className={`badge badge-sm ${wine.noBSMode ? 'bg-gray-800 text-gray-300' : 'bg-background-alt text-text-secondary'}`}>
                    {wine.year || wine.vintage}
                  </span>
                ) : null}
                
                {wine.region ? (
                  <span className={`badge badge-sm ${wine.noBSMode ? 'bg-gray-800 text-gray-300' : 'bg-background-alt text-text-secondary'}`}>
                    {wine.region}
                  </span>
                ) : null}
                
                {wine.grapeVariety || wine.varietal ? (
                  <span className={`badge badge-sm ${wine.noBSMode ? 'bg-gray-800 text-gray-300' : 'bg-background-alt text-text-secondary'}`}>
                    {wine.grapeVariety || wine.varietal}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="text-right ml-2 flex-shrink-0">
              <div className={`text-xl font-bold ${wine.noBSMode ? 'text-accent' : 'gradient-text'}`}>
                {wine.score ? wine.score : 'N/A'}<span className={`text-xs font-normal 
                  ${wine.noBSMode ? 'text-gray-400' : 'text-text-muted'}`}>/100</span>
              </div>
              <div className="flex items-center justify-end">
                <RatingStars rating={wine.score || 0} size="sm" darkMode={wine.noBSMode} />
              </div>
            </div>
          </div>
          
          {/* Action buttons row - Horizontal layout for compactness */}
          <div className="flex gap-2 mt-2">
            {/* Add to Personal List Button */}
            <button 
              onClick={handleTogglePersonalList}
              className={`btn btn-xs ${
                isInList 
                  ? wine.noBSMode 
                    ? 'bg-accent text-white hover:bg-accent-light' 
                    : 'bg-primary text-white hover:bg-primary-light' 
                  : wine.noBSMode 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'btn-secondary'
              }`}
            >
              {isInList ? (
                <>
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t('myList.inList', 'In My List')}
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {t('myList.add', 'Add to My List')}
                </>
              )}
            </button>
          
          {/* Price action button - Add it to the horizontal layout */}
          {priceActions}
          </div>
          
          {/* Error message */}
          {errorMessage && (
            <div className="mt-2 text-xs text-error font-medium animate-fade-in">
              {errorMessage}
            </div>
          )}
          
          {/* Display price and ratings in a more compact layout */}
          <div className="flex items-center mt-2 text-sm">
            {/* Display price */}
            {displayPrice}
            
            {/* User rating */}
            {wineRating && <div className="ml-auto">{wineRating}</div>}
          </div>
          
          {/* AI Review Section - Modern styling */}
          {wine.summary && (
            <div className={`mt-6 pt-6 border-t ${wine.noBSMode ? 'border-gray-700/30' : 'border-border'}`}>
              <div className="flex justify-between mb-3">
                <h3 className={`text-md font-display font-semibold ${wine.noBSMode ? 'text-gray-200' : 'text-text-primary'}`}>
                  {wine.noBSMode ? t('results.honestAssessment') : t('results.expertSummary')}
                </h3>
                {wine.noBSMode && (
                  <span className="badge badge-accent">
                    No BS Mode
                  </span>
                )}
              </div>
              <p className={`${wine.noBSMode ? 'text-accent-light font-medium italic' : 'text-text-secondary'} leading-relaxed`}>
                {wine.summary} 
              </p>
            </div>
          )}

          {/* Web Reviews Section - Only show for normal mode - Modern styling with collapsible content */} 
          {wine.webSnippets && !wine.noBSMode && (
            <div className="mt-6 pt-6 border-t border-border">
              <button 
                onClick={() => setShowWebReviews(!showWebReviews)}
                className="w-full flex justify-between items-center mb-3 hover:opacity-80 transition-opacity"
              >
                <h3 className="text-md font-display font-semibold text-text-primary">Web Reviews</h3>
                <div className="flex items-center">
                  {webSnippets.length > 0 && (
                    <span className="badge badge-primary mr-2">
                      {webSnippets.length} {webSnippets.length === 1 ? 'source' : 'sources'}
                    </span>
                  )}
                  <svg 
                    className={`w-5 h-5 text-text-secondary transition-transform duration-300 ${showWebReviews ? 'transform rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              {showWebReviews && (
                <div className="mt-3 space-y-4 animate-fade-in">
                  {webSnippets.length > 0 ? (
                    webSnippets.map((snippet, index) => (
                      <div key={index} className="p-4 bg-background-alt rounded-xl shadow-card 
                        border border-border hover:border-primary-light transition-colors animate-fade-in" 
                        style={{ animationDelay: `${index * 100}ms` }}>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-xs font-medium text-primary">
                            {snippet.source}
                          </p>
                        </div>
                        <p className="text-text-secondary italic leading-relaxed">
                          {snippet.snippet}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-5 bg-background-alt rounded-xl text-center animate-fade-in">
                      <svg className="w-12 h-12 mx-auto text-text-muted/30 mb-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <p className="text-text-secondary font-medium">No external reviews found for this wine.</p>
                      <p className="text-text-muted text-sm mt-1">Reviews are collected from wine sites across the web.</p>
                    </div>
                  )}
                </div>
              )}
              
              {!showWebReviews && webSnippets.length > 0 && (
                <p className="text-text-muted text-sm italic mt-1 cursor-pointer hover:text-primary" onClick={() => setShowWebReviews(true)}>
                  Click to show {webSnippets.length} web {webSnippets.length === 1 ? 'review' : 'reviews'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WineCard; 