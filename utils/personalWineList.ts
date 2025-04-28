import { Wine } from './types';
import { 
  addUserWine, 
  getUserWines, 
  removeUserWine, 
  clearUserWines, 
  rateUserWine,
  UserWine
} from './userWines';

// Key for localStorage
const PERSONAL_WINE_LIST_KEY = 'personal_wine_list';

/**
 * Get all wines from the user's personal list
 * @param userId Optional user ID for authenticated users
 */
export async function getPersonalWines(userId?: string): Promise<Wine[]> {
  console.log(`Getting personal wines. User authenticated: ${!!userId}`);
  
  // For authenticated users, get wines from Firebase
  if (userId) {
    try {
      console.log(`Fetching wines from Firebase for user: ${userId}`);
      const userWines = await getUserWines(userId);
      
      if (userWines.length === 0) {
        console.log('No wines found in Firebase, checking localStorage for fallback');
        
        // If Firebase returned no wines, check if we have any in localStorage
        // that might need migration
        if (typeof window !== 'undefined') {
          const savedWines = localStorage.getItem(PERSONAL_WINE_LIST_KEY);
          if (savedWines) {
            const localWines = JSON.parse(savedWines);
            if (localWines.length > 0) {
              console.log(`Found ${localWines.length} wines in localStorage, attempting migration`);
              // Don't await here - let migration happen in background
              migrateLocalStorageToFirebase(userId);
              return localWines;
            }
          }
        }
      }
      
      console.log(`Successfully converted ${userWines.length} Firebase wines to standard format`);
      return convertUserWinesToWines(userWines);
    } catch (error) {
      console.error('Error retrieving user wines from Firebase:', error);
      
      // If Firebase fails, fall back to localStorage as a backup
      if (typeof window !== 'undefined') {
        try {
          const savedWines = localStorage.getItem(PERSONAL_WINE_LIST_KEY);
          const localWines = savedWines ? JSON.parse(savedWines) : [];
          console.log(`Fallback to localStorage: found ${localWines.length} wines`);
          return localWines;
        } catch (localError) {
          console.error('Error retrieving from localStorage fallback:', localError);
        }
      }
      
      return [];
    }
  }
  
  // For unauthenticated users, use localStorage
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const savedWines = localStorage.getItem(PERSONAL_WINE_LIST_KEY);
    const wines = savedWines ? JSON.parse(savedWines) : [];
    console.log(`Retrieved ${wines.length} wines from localStorage (unauthenticated)`);
    return wines;
  } catch (error) {
    console.error('Error retrieving personal wine list from localStorage:', error);
    return [];
  }
}

/**
 * Add a wine to the user's personal list
 * @param wine The wine to add
 * @param userId Optional user ID for authenticated users
 * @returns The updated list of personal wines
 */
// Helper function to convert UserWine to Wine
function convertUserWinesToWines(userWines: UserWine[]): Wine[] {
  return userWines.map(userWine => {
    // Create a new Wine object with only Wine-compatible properties
    const wine: Wine = {
      id: userWine.id,
      name: userWine.name,
      winery: userWine.winery,
      producer: userWine.producer,
      year: userWine.year,
      vintage: userWine.vintage,
      region: userWine.region,
      grapeVariety: userWine.grapeVariety,
      varietal: userWine.varietal,
      type: userWine.type,
      imageUrl: userWine.imageUrl,
      uploadedImageUrl: userWine.uploadedImageUrl,
      rating: userWine.rating,
      additionalReviews: userWine.additionalReviews,
      // Skip aiSummary as it's not in the Wine type
      score: userWine.score,
      summary: userWine.summary,
      tastingNotes: userWine.tastingNotes,
      webSnippets: userWine.webSnippets,
      pairings: userWine.pairings,
      // Convert estimatedPrice to string format if needed
      estimatedPrice: userWine.estimatedPrice ? 
        `${userWine.estimatedPrice.currency} ${userWine.estimatedPrice.amount}` : 
        undefined,
      valueRatio: userWine.valueRatio,
      valueAssessment: userWine.valueAssessment,
      flavorProfile: userWine.flavorProfile,
      isFromMenu: userWine.isFromMenu,
      noBSMode: userWine.noBSMode,
      userRating: userWine.userRating,
      notes: userWine.notes,
      dateAdded: userWine.dateAdded ? new Date(userWine.dateAdded.toDate()) : undefined,
      priceEstimate: userWine.estimatedPrice ? {
        price: userWine.estimatedPrice.amount,
        currency: userWine.estimatedPrice.currency,
        confidence: 'medium' as 'high' | 'medium' | 'low',
        lastUpdated: userWine.estimatedPrice.lastUpdated.toDate()
      } : undefined
    };
    return wine;
  });
}

export async function addToPersonalList(wine: Wine, userId?: string): Promise<Wine[]> {
  // For authenticated users, add to Firebase
  if (userId) {
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        await addUserWine(userId, wine);
        const userWines = await getUserWines(userId);
        return convertUserWinesToWines(userWines);
      } catch (error: any) {
        retryCount++;
        console.error(`Error adding wine to Firebase (attempt ${retryCount}/${maxRetries + 1}):`, error);
        
        // Check if it's a BloomFilter error and we still have retries left
        if ((error?.name === 'BloomFilterError' || 
            (error?.message && error.message.includes('BloomFilter'))) && 
            retryCount <= maxRetries) {
          console.warn('BloomFilter error encountered, retrying with delay...');
          // Add a delay before retrying
          await new Promise(resolve => setTimeout(resolve, 800));
          continue;
        }
        
        // If we've exhausted retries or it's not a BloomFilter error and user is authenticated
        // Try to fall back to localStorage as a last resort
        if (typeof window !== 'undefined') {
          console.warn('Falling back to localStorage after Firebase error');
          try {
            return await addToLocalStorage(wine);
          } catch (localStorageError) {
            console.error('Failed localStorage fallback:', localStorageError);
            return [];
          }
        }
        
        return [];
      }
    }
  }
  
  // For unauthenticated users, use localStorage
  if (typeof window === 'undefined') {
    return [];
  }

  return await addToLocalStorage(wine);
}

// Helper function to add wine to localStorage
async function addToLocalStorage(wine: Wine): Promise<Wine[]> {
  try {
    const existingWines = await getPersonalWines();
    
    // Check if this wine is already in the list (by matching name, winery and year)
    const isAlreadyInList = existingWines.some(
      existingWine => 
        existingWine.name === wine.name &&
        existingWine.winery === wine.winery &&
        existingWine.year === wine.year
    );
    
    // Only add if it's not already in the list
    if (!isAlreadyInList) {
      // Generate a unique ID for the wine if it doesn't have one
      const wineWithId = {
        ...wine,
        id: wine.id || `wine-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      };
      
      const updatedWines = [...existingWines, wineWithId];
      localStorage.setItem(PERSONAL_WINE_LIST_KEY, JSON.stringify(updatedWines));
      return updatedWines;
    }
    
    return existingWines;
  } catch (error) {
    console.error('Error adding wine to personal list:', error);
    return await getPersonalWines();
  }
}

/**
 * Remove a wine from the user's personal list
 * @param wineId The ID of the wine to remove
 * @param userId Optional user ID for authenticated users
 * @returns The updated list of personal wines
 */
export async function removeFromPersonalList(wineId: string | undefined, userId?: string): Promise<Wine[]> {
  if (!wineId) return [];
  
  console.log(`Removing wine ${wineId} for user ${userId || 'anonymous'}`);
  
  // For authenticated users, remove from Firebase
  if (userId) {
    try {
      // First remove from Firebase
      await removeUserWine(userId, wineId);
      
      // Then get the updated list
      const userWines = await getUserWines(userId);
      
      // If we got back an empty array but it doesn't make sense
      // (e.g., Firebase error or connectivity issue)
      if (userWines.length === 0) {
        console.warn('Got empty list from Firebase after removing wine - may be an error');
        
        // Try to fetch from localStorage as a fallback
        const localWines = await getPersonalWines();
        
        // If we have local wines, filter out the removed one
        if (localWines && localWines.length > 0) {
          const updatedLocalWines = localWines.filter(wine => wine.id !== wineId);
          return updatedLocalWines;
        }
      }
      
      return convertUserWinesToWines(userWines);
    } catch (error) {
      console.error('Error removing wine from Firebase:', error);
      
      // On Firebase error, try to update the local version
      try {
        const localWines = await getPersonalWines();
        const updatedLocalWines = localWines.filter(wine => wine.id !== wineId);
        localStorage.setItem(PERSONAL_WINE_LIST_KEY, JSON.stringify(updatedLocalWines));
        return updatedLocalWines;
      } catch (localError) {
        console.error('Error updating localStorage after Firebase failure:', localError);
        return await getPersonalWines();
      }
    }
  }
  
  // For unauthenticated users, use localStorage
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const existingWines = await getPersonalWines();
    console.log(`Removing wine ${wineId} from ${existingWines.length} wines in localStorage`);
    
    // Make sure we filter only the specific wine
    const updatedWines = existingWines.filter(wine => wine.id !== wineId);
    
    // Make sure we didn't accidentally lose all wines
    if (existingWines.length > 0 && updatedWines.length === 0) {
      console.error('Something went wrong - all wines were filtered out. Wine removal aborted.');
      return existingWines; // Return original list to prevent data loss
    }
    
    localStorage.setItem(PERSONAL_WINE_LIST_KEY, JSON.stringify(updatedWines));
    return updatedWines;
  } catch (error) {
    console.error('Error removing wine from personal list:', error);
    return await getPersonalWines();
  }
}

/**
 * Check if a wine is in the user's personal list
 * @param wine The wine to check
 * @param userWines Optional pre-fetched user wines (for performance)
 * @returns Whether the wine is in the personal list
 */
export async function isInPersonalList(wine: Wine, userWines?: Wine[]): Promise<boolean> {
  if (!wine) {
    return false;
  }

  try {
    const existingWines = userWines || await getPersonalWines();
    
    return existingWines.some(
      existingWine => 
        (wine.id && existingWine.id === wine.id) || 
        (
          existingWine.name === wine.name &&
          existingWine.winery === wine.winery &&
          existingWine.year === wine.year
        )
    );
  } catch (error) {
    console.error('Error checking if wine is in personal list:', error);
    return false;
  }
}

/**
 * Clear the entire personal wine list
 * @param userId Optional user ID for authenticated users
 * @returns Empty array
 */
export async function clearPersonalList(userId?: string): Promise<Wine[]> {
  // For authenticated users, clear from Firebase
  if (userId) {
    try {
      await clearUserWines(userId);
      return [];
    } catch (error) {
      console.error('Error clearing user wines from Firebase:', error);
      return [];
    }
  }
  
  // For unauthenticated users, use localStorage
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    localStorage.removeItem(PERSONAL_WINE_LIST_KEY);
    return [];
  } catch (error) {
    console.error('Error clearing personal wine list:', error);
    return [];
  }
}

/**
 * Rate a wine in the user's personal list (only for authenticated users)
 * @param wineId The ID of the wine to rate
 * @param rating The rating (0-100)
 * @param userId The authenticated user's ID
 */
export async function rateWine(wineId: string | undefined, rating: number, userId: string): Promise<void> {
  if (!wineId) {
    throw new Error('Wine ID is required');
  }
  if (!userId) {
    throw new Error('User must be authenticated to rate wines');
  }

  try {
    await rateUserWine(userId, wineId, rating);
  } catch (error) {
    console.error('Error rating wine:', error);
    throw error;
  }
}

/**
 * Convert localStorage wines to Firebase when a user logs in
 * @param userId The authenticated user's ID
 */
export async function migrateLocalStorageToFirebase(userId: string): Promise<void> {
  if (typeof window === 'undefined' || !userId) {
    console.warn('Cannot migrate wines: window undefined or userId missing');
    return;
  }

  try {
    console.log(`Starting migration of localStorage wines to Firebase for user ${userId}`);
    
    const localWines = localStorage.getItem(PERSONAL_WINE_LIST_KEY);
    if (!localWines) {
      console.log('No localStorage wines found to migrate');
      return;
    }

    const wines: Wine[] = JSON.parse(localWines);
    if (wines.length === 0) {
      console.log('Empty wine array in localStorage, nothing to migrate');
      return;
    }
    
    console.log(`Found ${wines.length} wines in localStorage to migrate`);
    
    // Add each wine to Firebase with error handling for each individual wine
    const results = await Promise.allSettled(
      wines.map(wine => addUserWine(userId, wine))
    );
    
    // Count successes and failures
    const successes = results.filter(result => result.status === 'fulfilled').length;
    const failures = results.filter(result => result.status === 'rejected').length;
    
    console.log(`Migration complete: ${successes} wines added successfully, ${failures} failed`);
    
    // Only clear localStorage if at least some wines were successfully migrated
    // and there were no complete failures
    if (successes > 0 && failures === 0) {
      console.log('All wines migrated successfully, clearing localStorage');
      localStorage.removeItem(PERSONAL_WINE_LIST_KEY);
    } else if (successes > 0) {
      console.log('Partial migration success, keeping localStorage as backup');
      // Mark localStorage as partially migrated
      localStorage.setItem('wine_migration_attempted', 'true');
    } else {
      console.error('Migration completely failed, keeping localStorage intact');
    }
  } catch (error) {
    console.error('Error migrating localStorage wines to Firebase:', error);
  }
}