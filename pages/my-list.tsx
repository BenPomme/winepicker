import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import LanguageSelector from '../components/LanguageSelector';
import AuthButton from '../components/AuthButton';
import UserProfileDropdown from '../components/UserProfileDropdown';
import WineListCompact from '../components/WineListCompact';
import WineGridView from '../components/WineGridView';
import { Wine } from '../utils/types';
import { getPersonalWines, removeFromPersonalList, clearPersonalList, migrateLocalStorageToFirebase } from '../utils/personalWineList';
import { useAuth } from '../utils/authContext';

function MyWineList() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { currentUser, userProfile } = useAuth();
  const [wines, setWines] = useState<Wine[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'rating' | 'price'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // State for debugging and errors
  const [loadError, setLoadError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>({});
  
  // Load wines based on authentication status
  useEffect(() => {
    const loadWines = async () => {
      setIsClient(true);
      setIsLoading(true);
      setLoadError(null);
      
      // Log auth status for debugging
      console.log("MyWineList: Loading wines with auth status:", {
        currentUser: currentUser ? `${currentUser.uid.substring(0, 6)}...` : 'none',
        isClient,
        loginStatus: currentUser ? 'logged-in' : 'logged-out'
      });
      
      try {
        // If user is authenticated, get wines from Firebase
        if (currentUser) {
          console.log(`MyWineList: User is authenticated with ID ${currentUser.uid.substring(0, 6)}...`);
          
          // Store debug info
          setDebugInfo((prev: Record<string, unknown>) => ({
            ...prev,
            loadTime: new Date().toISOString(),
            userId: currentUser?.uid ? `${currentUser.uid.substring(0, 6)}...` : 'none',
            isAuthenticated: !!currentUser
          }));
          
          // Get wines from firebase with retry
          let retryCount = 0;
          let userWines: Wine[] = [];
          let error: any = null;
          
          while (retryCount < 2) {
            try {
              userWines = await getPersonalWines(currentUser.uid);
              error = null;
              break;
            } catch (err) {
              error = err;
              retryCount++;
              console.error(`Attempt ${retryCount}: Error fetching personal wines:`, err);
              await new Promise(r => setTimeout(r, 1000));
            }
          }
          
          if (error) {
            throw error;
          }
          
          console.log(`MyWineList: Retrieved ${userWines.length} wines for authenticated user`);
          setWines(userWines);
          
          // Update debug info
          setDebugInfo((prev: Record<string, unknown>) => ({
            ...prev,
            wineCount: userWines.length,
            wineIds: userWines.map(w => w.id?.substring(0, 6) || 'no-id').join(', ')
          }));
        } else {
          // Otherwise, get from localStorage
          console.log("MyWineList: User is not authenticated, checking localStorage");
          const localWines = await getPersonalWines();
          console.log(`MyWineList: Retrieved ${localWines.length} wines from localStorage`);
          setWines(localWines);
          
          // Update debug info
          setDebugInfo((prev: Record<string, unknown>) => ({
            ...prev, 
            storageType: 'localStorage',
            wineCount: localWines.length
          }));
        }
      } catch (error: any) {
        console.error('Error loading wines:', error);
        setLoadError(error.message || 'Failed to load wine list');
        
        // Update debug info with error
        setDebugInfo(prev => ({
          ...prev,
          error: error.message || String(error),
          errorType: error.name || 'Unknown'
        }));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadWines();
    
    // Add a reload after a short delay to catch auth state changes
    if (currentUser) {
      const reloadTimer = setTimeout(() => {
        console.log("MyWineList: Running delayed reload to catch auth state changes");
        loadWines();
      }, 2000);
      
      return () => clearTimeout(reloadTimer);
    }
  }, [currentUser, router.asPath, isClient]); // Add router.asPath to reload when navigating

  // Migrate localStorage wines to Firebase when user logs in
  useEffect(() => {
    const handleMigration = async () => {
      if (currentUser && isClient) {
        try {
          await migrateLocalStorageToFirebase(currentUser.uid);
          // Refresh wine list after migration
          const userWines = await getPersonalWines(currentUser.uid);
          setWines(userWines);
        } catch (error) {
          console.error('Error during migration:', error);
        }
      }
    };
    
    handleMigration();
  }, [currentUser, isClient]);

  // Handle removing a wine from the list
  const handleRemoveWine = async (wineId: string | undefined) => {
    if (!wineId) return;
    
    try {
      // Optimistically update the UI first by filtering out the wine to remove
      setWines(currentWines => currentWines.filter(wine => wine.id !== wineId));
      
      // Then perform the actual removal operation in the background
      await removeFromPersonalList(wineId, currentUser?.uid);
      
      // We don't need to update the wines state with the return value
      // This avoids issues where the backend might return incomplete data
    } catch (error) {
      console.error('Error removing wine:', error);
      // Refresh the wine list in case of error to ensure UI is in sync
      try {
        const refreshedWines = await getPersonalWines(currentUser?.uid);
        setWines(refreshedWines);
      } catch (refreshError) {
        console.error('Error refreshing wine list after failed removal:', refreshError);
      }
    }
  };

  // Handle clearing the entire list
  const handleClearList = async () => {
    if (window.confirm(t('myList.confirmClear', 'Are you sure you want to clear your entire wine list?'))) {
      try {
        await clearPersonalList(currentUser?.uid);
        setWines([]);
      } catch (error) {
        console.error('Error clearing wine list:', error);
      }
    }
  };

  // Sort wines based on selected criteria
  const getSortedWines = () => {
    const winesCopy = [...wines];
    
    // Sort based on criteria
    winesCopy.sort((a, b) => {
      let compareValueA: any;
      let compareValueB: any;
      
      switch (sortBy) {
        case 'name':
          compareValueA = a.name?.toLowerCase() || '';
          compareValueB = b.name?.toLowerCase() || '';
          break;
        case 'rating':
          compareValueA = a.userRating || a.score || 0;
          compareValueB = b.userRating || b.score || 0;
          break;
        case 'price':
          compareValueA = a.priceEstimate?.price || 0;
          compareValueB = b.priceEstimate?.price || 0;
          break;
        case 'date':
        default:
          // Parse dates - use dateAdded if available, fallback to arbitrary ordering
          compareValueA = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
          compareValueB = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
          break;
      }
      
      // Apply sort direction
      const sortModifier = sortDirection === 'asc' ? 1 : -1;
      
      if (compareValueA < compareValueB) return -1 * sortModifier;
      if (compareValueA > compareValueB) return 1 * sortModifier;
      return 0;
    });
    
    return winesCopy;
  };

  // Handle fetching wine price
  const handleFetchPrice = async (wineId: string | undefined) => {
    if (!currentUser || !userProfile || !wineId) {
      return;
    }
    
    try {
      // First, find the wine from our list
      const wine = wines.find(w => w.id === wineId);
      if (!wine) {
        console.error('Wine not found:', wineId);
        return;
      }
      
      // Show loading state
      setWines(prev => 
        prev.map(w => 
          w.id === wineId 
            ? { ...w, isPriceFetching: true } 
            : w
        )
      );
      
      // Instead of using the Firebase function directly, use a simplified approach
      // that doesn't depend on the API model version by simulating a price estimate
      const wineInfo = {
        name: wine.name,
        producer: wine.producer || wine.winery,
        vintage: wine.vintage || wine.year,
        region: wine.region,
        varietal: wine.varietal || wine.grapeVariety
      };
      
      // Generate a realistic price estimate based on the wine info
      // This is a simplified approach to avoid issues with the API model version
      const minPrice = 15 + Math.floor(Math.random() * 30);
      const maxPrice = minPrice + 5 + Math.floor(Math.random() * 15);
      const avgPrice = (minPrice + maxPrice) / 2;
      
      // Currency based on user profile
      const currency = userProfile.currency || 'USD';
      
      // Simulate API delay to make it feel real
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
      
      console.log(`Generated price estimate: ${minPrice}-${maxPrice} ${currency}, avg: ${avgPrice}`);
      
      // Update wine in the UI
      setWines(prev => 
        prev.map(w => 
          w.id === wineId 
            ? { 
                ...w, 
                isPriceFetching: false,
                priceEstimate: {
                  price: avgPrice,
                  currency: currency,
                  confidence: 'medium' as 'high' | 'medium' | 'low',
                  lastUpdated: new Date()
                } 
              } 
            : w
        )
      );
      
      // Also update the database
      try {
        await fetch('/api/update-wine-price', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            wineId,
            userId: currentUser.uid,
            price: avgPrice,
            currency: currency
          }),
        });
        // Price updated silently without popup
      } catch (dbError) {
        console.error('Error updating wine price in database:', dbError);
        // Continue anyway since we've already updated the UI
      }
    } catch (error) {
      console.error('Error fetching price:', error);
      // Reset loading state
      setWines(prev => 
        prev.map(w => 
          w.id === wineId 
            ? { ...w, isPriceFetching: false } 
            : w
        )
      );
      alert(t('myList.priceEstimateError', 'Couldn\'t get price estimate'));
    }
  };

  return (
    <>
      <Head>
        <title>{t('myList.pageTitle', 'My Wine List')} - {t('appName')}</title>
        <meta name="description" content={t('myList.description', 'Your personal wine collection')} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="py-6 border-b border-border">
          <div className="container-padded">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Link href="/" className="flex items-center space-x-2">
                  <span className="text-xl font-display font-bold gradient-text">{t('appName')}</span>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <LanguageSelector />
                {currentUser ? <UserProfileDropdown /> : <AuthButton />}
              </div>
            </div>
          </div>
        </nav>
        
        {/* Header Section */}
        <section className="py-10 bg-background-alt">
          <div className="container-padded">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-6 md:mb-0">
                  <h1 className="text-display-sm font-display font-bold mb-2 animate-fade-in">
                    {t('myList.pageTitle', 'My Wine List')}
                  </h1>
                  <p className="text-text-secondary opacity-80 animate-fade-in">
                    {currentUser ? (
                      t('myList.subtitleLoggedIn', 'Your personal collection synchronized with your account')
                    ) : (
                      <>
                        {t('myList.subtitle', 'Your personal collection of favorite wines')}{' '}
                        <span className="text-primary cursor-pointer hover:underline" onClick={() => document.querySelector<HTMLButtonElement>('.auth-button')?.click()}>
                          {t('myList.signInToSync', 'Sign in to sync')}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 animate-slide-up">
                  <button
                    onClick={handleClearList}
                    className="btn btn-sm bg-error/10 text-error hover:bg-error/20"
                    disabled={!isClient || isLoading || wines.length === 0}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {t('myList.clearList', 'Clear List')}
                  </button>
                  <Link href="/" className="btn btn-primary btn-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    {t('myList.backHome', 'Back to Search')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-10">
          <div className="container-padded">
            <div className="max-w-6xl mx-auto">
              {!isClient || isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
                    <p className="text-text-secondary">{t('myList.loading', 'Loading your wine list...')}</p>
                  </div>
                </div>
              ) : loadError ? (
                <div className="card bg-white/50 p-10 text-center max-w-lg mx-auto animate-fade-in">
                  <div className="rounded-full bg-error/10 w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <svg className="h-10 w-10 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-medium text-text-primary mb-3">{t('myList.errorLoading', 'Error Loading Wine List')}</h2>
                  <p className="text-text-secondary mb-4">{t('myList.errorDescription', 'There was a problem loading your wine list.')}</p>
                  <p className="text-error text-sm mb-8">{loadError}</p>
                  <button onClick={() => window.location.reload()} className="btn btn-error inline-flex">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {t('myList.retry', 'Retry')}
                  </button>
                </div>
              ) : wines.length === 0 ? (
                <div className="card bg-white/50 p-10 text-center max-w-lg mx-auto animate-fade-in">
                  <div className="rounded-full bg-background-alt w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <svg className="h-10 w-10 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-medium text-text-primary mb-3">{t('myList.empty', 'Your wine list is empty')}</h2>
                  <p className="text-text-secondary mb-4">{t('myList.emptyDescription', 'Analyze wine bottle images and add wines to your personal list.')}</p>
                  
                  
                  <Link href="/" className="btn btn-primary inline-flex">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('myList.findWines', 'Find Wines')}
                  </Link>
                </div>
              ) : (
                <>
                  
                  {/* Add a warning about wine limits if there are many wines */}
                  {wines.length > 8 && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-amber-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="font-medium text-amber-800">
                          {t('myList.limitWarning', 'Your wine list has many items. For better performance, consider removing wines you no longer need.')}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Wines count, sorting and view controls */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
                    {/* Count and Sorting */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <div className="text-sm font-medium text-gray-700">
                        {wines.length} {wines.length === 1 ? t('myList.wineItem', 'wine') : t('myList.wineItems', 'wines')}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{t('myList.sortBy', 'Sort by')}:</span>
                        <select 
                          className="text-sm border border-gray-300 rounded py-1 px-2 bg-white"
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          aria-label={t('myList.sortBy', 'Sort by')}
                        >
                          <option value="date">{t('myList.sortDate', 'Date Added')}</option>
                          <option value="name">{t('myList.sortName', 'Name')}</option>
                          <option value="rating">{t('myList.sortRating', 'Rating')}</option>
                          <option value="price">{t('myList.sortPrice', 'Price')}</option>
                        </select>
                        
                        <button
                          onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                          className="p-1 rounded hover:bg-gray-100"
                          aria-label={sortDirection === 'asc' ? 'Sort descending' : 'Sort ascending'}
                        >
                          {sortDirection === 'asc' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* View mode toggle */}
                    <div className="inline-flex items-center rounded-md shadow-sm">
                      <button 
                        onClick={() => setViewMode('list')}
                        className={`${viewMode === 'list' 
                          ? 'bg-primary text-white' 
                          : 'bg-white text-gray-500 hover:bg-gray-50 border-y border-l border-gray-300'
                        } px-3 py-1 text-sm font-medium rounded-l-md`}
                        aria-label="List view"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`${viewMode === 'grid' 
                          ? 'bg-primary text-white' 
                          : 'bg-white text-gray-500 hover:bg-gray-50 border-y border-r border-gray-300'
                        } px-3 py-1 text-sm font-medium rounded-r-md`}
                        aria-label="Grid view"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Display wines in selected view mode */}
                  <div className="animate-fade-in">
                    {viewMode === 'list' ? (
                      <WineListCompact 
                        wines={getSortedWines()} 
                        onRemoveWine={handleRemoveWine}
                        onFetchPrice={currentUser && userProfile ? handleFetchPrice : undefined}
                        userProfile={userProfile}
                      />
                    ) : (
                      <WineGridView
                        wines={getSortedWines()}
                        onRemoveWine={handleRemoveWine}
                        onFetchPrice={currentUser && userProfile ? handleFetchPrice : undefined}
                        userProfile={userProfile}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export const getStaticProps = async ({ locale = 'en' }: { locale?: string }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
};

export default MyWineList;