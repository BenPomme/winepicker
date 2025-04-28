import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';

interface DemoProcessingButtonProps {
  onDemo: (base64Image: string) => void;
  isStaging?: boolean;
  isProcessing: boolean;
}

const DemoProcessingButton: React.FC<DemoProcessingButtonProps> = ({ 
  onDemo, 
  isStaging = false,
  isProcessing = false
}) => {
  const { t } = useTranslation('common');
  const [showOptions, setShowOptions] = useState(false);
  
  // Check if we're in staging environment
  const isInStagingEnv = React.useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.location.hostname.includes('winepicker-63daa') || isStaging;
    }
    return isStaging;
  }, [isStaging]);
  
  // Don't show in production or when processing is already in progress
  if (!isInStagingEnv || isProcessing) {
    return null;
  }
  
  // Generate demo base64 image
  const getDemoImage = () => {
    // Generate a tiny 1x1 transparent pixel to use as a dummy image
    return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  };
  
  // Simulate demo processing with real-time progress
  const handleDemoClick = () => {
    // Clear any existing intervals before starting the demo
    if (typeof window !== 'undefined') {
      // Clear progress animation interval
      // @ts-ignore - custom property for storing interval ID
      if (window.progressInterval) {
        // @ts-ignore
        clearInterval(window.progressInterval);
        // @ts-ignore
        window.progressInterval = null;
      }
      
      // Clear any polling interval
      // @ts-ignore - custom property for storing interval ID
      if (window.pollingInterval) {
        // @ts-ignore
        clearInterval(window.pollingInterval);
        // @ts-ignore
        window.pollingInterval = null;
      }
    }
    
    console.log('Starting demo wine analysis with animated progress bar');
    
    // Hide options menu immediately for better UX
    setShowOptions(false);
    
    // Slight timeout to ensure UI updates before heavy processing
    setTimeout(() => {
      // Pass a dummy base64 image to the handler
      onDemo(getDemoImage());
    }, 10);
  };
  
  return (
    <div className="mb-8">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="btn btn-secondary mb-2"
      >
        {t('demo.tryProcessing', 'Try Demo Processing')}
      </button>
      
      {showOptions && (
        <div className="flex flex-col space-y-2 mb-2 max-w-xs mx-auto">
          <button 
            className="btn btn-primary btn-sm" 
            onClick={handleDemoClick}
          >
            {t('demo.quickDemo', 'Start Demo')}
          </button>
          <p className="italic text-xs text-text-muted">
            No need to upload a real image
          </p>
        </div>
      )}
      
      <p className="text-sm text-text-secondary">
        {t('demo.clickToSee', 'Click to see how image processing works')}
      </p>
    </div>
  );
};

export default DemoProcessingButton;