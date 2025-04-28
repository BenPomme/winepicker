import React from 'react';

interface ReviewSectionProps {
  review: string;
  isPrimary: boolean;
  darkMode?: boolean;
}

const ReviewSection = ({ review, isPrimary, darkMode = false }: ReviewSectionProps) => {
  // Parse the review string into components
  let source = '';
  let rating = '';
  let reviewText = '';

  if (review.includes('(') && review.includes('):')) {
    // Format: "Source (Rating): Review"
    source = review.split('(')[0].trim();
    rating = review.split('(')[1].split(')')[0].trim();
    reviewText = review.split('): ')[1].replace(/"/g, '').trim();
  } else if (review.includes(':')) {
    // Format: "Source: Review" or "Source (Rating): Review" with different structure
    const parts = review.split(':');
    const titlePart = parts[0];
    
    // Check if there's a rating in parentheses
    if (titlePart.includes('(') && titlePart.includes(')')) {
      source = titlePart.split('(')[0].trim();
      rating = titlePart.split('(')[1].split(')')[0].trim();
    } else {
      source = titlePart.trim();
    }
    
    // Join the rest as the review text
    reviewText = parts.slice(1).join(':').replace(/"/g, '').trim();
  } else {
    // Unformatted review
    reviewText = review;
  }

  return (
    <div className={`
      animate-fade-in rounded-xl shadow-card transition-all duration-300 hover:shadow-card-hover
      ${isPrimary 
        ? (darkMode ? 'bg-background-dark/50 p-4' : 'bg-background-alt p-4') 
        : (darkMode ? 'bg-gray-800 border border-gray-700 p-3' : 'bg-white border border-border p-3')}
    `}>
      {/* Source and rating */}
      {(source || rating) && (
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {source && (
            <span className={`${darkMode ? 'text-accent' : 'text-primary'} font-medium text-xs`}>
              {source}
            </span>
          )}
          
          {rating && (
            <span className={`badge ${darkMode ? 'badge-accent' : 'badge-primary'} text-xs`}>
              {rating}
            </span>
          )}
        </div>
      )}
      
      {/* Review text */}
      <div className={`
        italic 
        ${darkMode ? 'text-gray-300' : 'text-text-secondary'}
        ${isPrimary ? 'text-sm leading-relaxed' : 'text-xs leading-relaxed'}
      `}>
        &ldquo;{reviewText}&rdquo;
      </div>
    </div>
  );
};

export default ReviewSection; 