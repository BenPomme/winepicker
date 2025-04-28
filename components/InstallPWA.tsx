import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPWA = () => {
  const { t } = useTranslation('common');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if already installed as PWA
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         'standalone' in window.navigator && (window.navigator as any).standalone;
      
      if (isStandalone) {
        // Already installed - don't show anything
        return;
      }

      // Check for iOS
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      setIsIOS(isIOSDevice);
      
      if (isIOSDevice) {
        // For iOS, show immediately on every visit
        setShowInstallBanner(true);
      } else {
        // For Android and other browsers that support beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e) => {
          // Prevent Chrome 67 and earlier from automatically showing the prompt
          e.preventDefault();
          // Stash the event so it can be triggered later
          setDeferredPrompt(e as BeforeInstallPromptEvent);
          setIsInstallable(true);
          // Show the banner immediately
          setShowInstallBanner(true);
        });
      }

      // Track when app is installed
      window.addEventListener('appinstalled', () => {
        setDeferredPrompt(null);
        setIsInstallable(false);
        setShowInstallBanner(false);
        console.log('PWA was installed');
      });
    }
  }, []);

  const handleInstall = () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
          setShowInstallBanner(false);
        } else {
          console.log('User dismissed the install prompt');
        }
        // We no longer need the prompt, clear it
        setDeferredPrompt(null);
        setIsInstallable(false);
      });
    }
  };
  
  const dismissBanner = () => {
    // Only hide temporarily for this session
    setShowInstallBanner(false);
  };

  // Don't render if not showing the banner
  if (!showInstallBanner) return null;
  
  // Fixed banner at the bottom
  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-lg p-4 z-50 flex items-center justify-between animate-slide-up">
        <div className="flex items-center">
          <div className="bg-red-700 rounded-full p-2 mr-3">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
              />
            </svg>
          </div>
          <div>
            <h3 className="font-bold">{t('pwa.installTitle', 'Add MyWine to Home Screen')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('pwa.installSubtitle', 'For faster access & offline use')}</p>
          </div>
        </div>
        <div className="flex items-center">
          <button 
            onClick={dismissBanner}
            className="text-gray-500 mr-3"
            aria-label="Dismiss"
          >
            {t('pwa.notNow', 'Not now')}
          </button>
          <button 
            onClick={handleInstall}
            className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded"
          >
            {t('pwa.install', 'Install App')}
          </button>
        </div>
      </div>
      
      {showIOSInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{t('pwa.iosTitle', 'Install on iOS')}</h3>
              <button 
                onClick={() => setShowIOSInstructions(false)}
                className="text-gray-500"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <ol className="list-decimal pl-5 space-y-3 mb-6">
              <li className="flex items-center">
                {t('pwa.iosStep1', 'Tap the share button')}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </li>
              <li>{t('pwa.iosStep2', 'Scroll down and tap "Add to Home Screen"')}</li>
              <li>{t('pwa.iosStep3', 'Tap "Add" in the top right corner')}</li>
            </ol>
            
            <div className="flex justify-end">
              <button 
                onClick={() => setShowIOSInstructions(false)}
                className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded"
              >
                {t('pwa.gotIt', 'Got it')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallPWA;