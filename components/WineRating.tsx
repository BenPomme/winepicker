import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useAuth } from '../utils/authContext';
import { rateWine } from '../utils/personalWineList';
import RatingStars from './RatingStars';

interface WineRatingProps {
  wineId: string | undefined;
  initialRating?: number;
  className?: string;
}

export default function WineRating({ wineId, initialRating = 0, className }: WineRatingProps) {
  const { t } = useTranslation('common');
  const { currentUser } = useAuth();
  const [rating, setRating] = useState<number>(initialRating);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  // Handle rating change
  const handleRatingChange = async (newRating: number) => {
    // Require authentication and valid wineId
    if (!currentUser) {
      setError(t('myList.signInToRate', 'Sign in to rate wines'));
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    if (!wineId) {
      setError(t('common.error', 'Invalid wine ID'));
      setTimeout(() => setError(''), 3000);
      return;
    }

    setIsSubmitting(true);
    setRating(newRating);
    setError('');
    
    try {
      await rateWine(wineId, newRating, currentUser.uid);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error rating wine:', error);
      setError(t('common.error', 'Error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <span className="text-xs font-medium text-text-secondary mr-2">
        {t('myList.yourRating', 'Your Rating')}:
      </span>
      
      <RatingStars 
        rating={rating} 
        onChange={handleRatingChange}
        size="sm"
      />
      
      {isSubmitting && (
        <span className="inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin ml-1"></span>
      )}
      
      {showSuccess && (
        <span className="text-xs text-success ml-1 animate-fade-in">
          ✓
        </span>
      )}
      
      {error && (
        <span className="text-xs text-error ml-1 animate-fade-in">
          !
        </span>
      )}
    </div>
  );
}