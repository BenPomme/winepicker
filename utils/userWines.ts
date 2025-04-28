import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Wine } from './types';

// Interface for a user's rated wine - omit conflicting fields
export interface UserWine extends Omit<Wine, 'estimatedPrice' | 'dateAdded'> {
  userRating?: number;    // User's personal rating
  dateAdded: Timestamp;   // Date when wine was added to the list (Firestore timestamp)
  notes?: string;         // User's personal notes about the wine
  estimatedPrice?: {
    amount: number;
    currency: string;
    lastUpdated: Timestamp;
  };
}

// Add a wine to a user's list in Firebase
export const addUserWine = async (userId: string, wine: Wine): Promise<UserWine> => {
  try {
    // Generate a unique document ID if the wine doesn't have one
    const wineId = wine.id || `wine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create a UserWine object with only the fields we need
    const userWine: UserWine = {
      // Standard Wine fields
      id: wineId,
      name: wine.name,
      winery: wine.winery,
      producer: wine.producer,
      year: wine.year,
      vintage: wine.vintage,
      region: wine.region,
      grapeVariety: wine.grapeVariety,
      varietal: wine.varietal,
      type: wine.type,
      imageUrl: wine.imageUrl,
      uploadedImageUrl: wine.uploadedImageUrl,
      rating: wine.rating,
      additionalReviews: wine.additionalReviews,
      aiSummary: wine.aiSummary,
      score: wine.score,
      summary: wine.summary,
      tastingNotes: wine.tastingNotes,
      webSnippets: wine.webSnippets,
      pairings: wine.pairings,
      valueRatio: wine.valueRatio,
      valueAssessment: wine.valueAssessment,
      flavorProfile: wine.flavorProfile,
      isFromMenu: wine.isFromMenu,
      noBSMode: wine.noBSMode,
      // User-specific fields
      userRating: wine.userRating,
      notes: wine.notes,
      dateAdded: Timestamp.now()
    };
    
    // Add the wine to the user's collection
    const wineDocRef = doc(db, `users/${userId}/wines`, wineId);
    
    // Try to set the document
    try {
      await setDoc(wineDocRef, userWine);
    } catch (setDocError: any) {
      // Check if it's a BloomFilter error
      if (setDocError?.name === 'BloomFilterError' || 
          (setDocError?.message && setDocError.message.includes('BloomFilter'))) {
        console.warn('BloomFilter error encountered, trying with a simplified document structure');
        
        // Simplify the document by removing potentially problematic fields
        const simplifiedWine = { ...userWine };
        // Remove any complex fields that might be causing issues
        delete simplifiedWine.webSnippets;
        delete simplifiedWine.additionalReviews;
        delete simplifiedWine.flavorProfile;
        
        // Try again with the simplified document
        await setDoc(wineDocRef, simplifiedWine);
        return simplifiedWine;
      } else {
        // If it's not a BloomFilter error, rethrow
        throw setDocError;
      }
    }
    
    return userWine;
  } catch (error) {
    console.error('Error adding wine to user collection:', error);
    throw error;
  }
};

// Get all wines from a user's list
export const getUserWines = async (userId: string): Promise<UserWine[]> => {
  console.log(`getUserWines called for userId: ${userId.substring(0, 6)}...`);
  
  try {
    // Verify the userId isn't empty or malformed
    if (!userId || userId.length < 5) {
      console.error('Invalid userId provided to getUserWines:', userId);
      return [];
    }
    
    // Explicitly construct collection path and log it
    const collectionPath = `users/${userId}/wines`;
    console.log(`Accessing Firestore collection at path: ${collectionPath}`);
    
    const winesRef = collection(db, collectionPath);
    let retryCount = 0;
    const maxRetries = 3; // Increased retries
    
    while (retryCount <= maxRetries) {
      try {
        // Add explicit logging
        console.log(`Fetching wines from Firestore, attempt ${retryCount + 1}/${maxRetries + 1}`);
        
        const winesSnapshot = await getDocs(winesRef);
        console.log(`Firestore query returned ${winesSnapshot.docs.length} documents`);
        
        const userWines = winesSnapshot.docs.map(doc => {
          const data = doc.data();
          const docId = doc.id;
          
          console.log(`Processing document ID: ${docId}`);
          
          // Ensure all required fields exist with sensible defaults
          if (!data.id) {
            console.log(`Document ${docId} is missing id field, using docId`);
            data.id = docId;
          }
          
          if (!data.dateAdded) {
            console.log(`Document ${docId} is missing dateAdded, adding timestamp`);
            data.dateAdded = Timestamp.now();
          }
          
          if (!data.name) {
            console.log(`Document ${docId} is missing name field, using placeholder`);
            data.name = "Unnamed Wine";
          }
          
          return data as UserWine;
        });
        
        console.log(`Successfully processed ${userWines.length} wine documents`);
        return userWines;
      } catch (fetchError: any) {
        retryCount++;
        
        console.error(`Error fetching wines (attempt ${retryCount}/${maxRetries + 1}):`, 
          fetchError?.name || 'Unknown Error',
          fetchError?.message || 'No message');
        
        // Enhanced error detection with more error types 
        const isRetryableError = 
          fetchError?.name === 'BloomFilterError' || 
          (fetchError?.message && fetchError.message.includes('BloomFilter')) ||
          fetchError?.name === 'FirebaseError' ||
          fetchError?.name === 'NetworkError' ||
          fetchError?.name === 'TimeoutError' ||
          (fetchError?.code && fetchError.code.includes('unavailable')) ||
          (fetchError?.code && fetchError.code.includes('deadline-exceeded'));
        
        if (isRetryableError && retryCount <= maxRetries) {
          // Exponential backoff
          const delayMs = Math.min(1000 * Math.pow(2, retryCount - 1), 8000);
          console.warn(`Retryable error encountered when fetching wines, retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        } else {
          throw fetchError;
        }
      }
    }
    
    // This should never be reached, but TypeScript requires a return
    throw new Error('Failed to fetch wines after multiple retries');
  } catch (error) {
    console.error('Error getting user wines:', error);
    // Return empty array instead of throwing to prevent UI breaking
    return [];
  }
};

// Update a wine in the user's list
export const updateUserWine = async (
  userId: string, 
  wineId: string, 
  updates: Partial<UserWine>
): Promise<void> => {
  try {
    const wineDocRef = doc(db, `users/${userId}/wines`, wineId);
    await updateDoc(wineDocRef, updates);
  } catch (error) {
    console.error('Error updating user wine:', error);
    throw error;
  }
};

// Remove a wine from the user's list
export const removeUserWine = async (userId: string, wineId: string | undefined): Promise<void> => {
  if (!wineId) return;
  
  try {
    // First check if the wine exists
    const wineDocRef = doc(db, `users/${userId}/wines`, wineId);
    const wineDoc = await getDoc(wineDocRef);
    
    if (!wineDoc.exists()) {
      console.warn(`Wine ${wineId} not found for user ${userId}`);
      return; // No need to delete if it doesn't exist
    }
    
    // Delete the wine document
    await deleteDoc(wineDocRef);
    console.log(`Successfully removed wine ${wineId} for user ${userId}`);
  } catch (error) {
    console.error('Error removing user wine:', error);
    throw error;
  }
};

// Clear all wines from the user's list
export const clearUserWines = async (userId: string): Promise<void> => {
  try {
    const winesRef = collection(db, `users/${userId}/wines`);
    const winesSnapshot = await getDocs(winesRef);
    
    const deletePromises = winesSnapshot.docs.map(
      docSnapshot => deleteDoc(doc(db, `users/${userId}/wines`, docSnapshot.id))
    );
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error clearing user wines:', error);
    throw error;
  }
};

// Update the user's rating for a wine
export const rateUserWine = async (
  userId: string, 
  wineId: string | undefined, 
  rating: number
): Promise<void> => {
  if (!wineId) return;
  try {
    const wineDocRef = doc(db, `users/${userId}/wines`, wineId);
    await updateDoc(wineDocRef, { 
      userRating: rating 
    });
  } catch (error) {
    console.error('Error rating user wine:', error);
    throw error;
  }
};

// Update price estimate for a wine
export const updateWinePrice = async (
  userId: string, 
  wineId: string, 
  price: number, 
  currency: string
): Promise<void> => {
  try {
    const wineDocRef = doc(db, `users/${userId}/wines`, wineId);
    await updateDoc(wineDocRef, { 
      estimatedPrice: {
        amount: price,
        currency,
        lastUpdated: Timestamp.now()
      }
    });
  } catch (error) {
    console.error('Error updating wine price:', error);
    throw error;
  }
};

// Add user notes to a wine
export const addWineNotes = async (
  userId: string, 
  wineId: string, 
  notes: string
): Promise<void> => {
  try {
    const wineDocRef = doc(db, `users/${userId}/wines`, wineId);
    await updateDoc(wineDocRef, { notes });
  } catch (error) {
    console.error('Error adding wine notes:', error);
    throw error;
  }
};