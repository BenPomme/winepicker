import React from 'react';

interface ReviewSectionProps {
  review: string;
  isPrimary: boolean;
}

const ReviewSection = ({ review, isPrimary }: ReviewSectionProps) => {
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
      ${isPrimary 
        ? 'bg-background rounded-lg p-3' 
        : 'bg-white border border-border rounded p-2'}
    `}>
      {/* Source and rating */}
      {(source || rating) && (
        <div className="flex flex-wrap items-center gap-1 mb-1">
          {source && (
            <span className="text-primary font-medium text-xs">
              {source}
            </span>
          )}
          
          {rating && (
            <span className="bg-warning bg-opacity-10 text-warning text-xs font-semibold px-1.5 py-0.5 rounded">
              {rating}
            </span>
          )}
        </div>
      )}
      
      {/* Review text */}
      <div className={`
        italic text-background-dark
        ${isPrimary ? 'text-sm leading-tight' : 'text-xs'}
      `}>
        "{reviewText}"
      </div>
    </div>
  );
};

export default ReviewSection; 