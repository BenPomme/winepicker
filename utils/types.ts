/**
 * Global type definitions for the Wine Picker application
 */

// Subscription tier enum
export enum SubscriptionTier {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium'
}

// Subscription feature access
export interface SubscriptionFeatures {
  maxWineScans: number;
  wineDetailsAccess: boolean;
  exportOptions: boolean;
  detailedTastingNotes: boolean;
  foodPairingSuggestions: boolean;
  exclusiveContent: boolean;
}

// User subscription information
export interface UserSubscription {
  tier: SubscriptionTier;
  planId: string;
  startDate: number; // timestamp
  endDate: number; // timestamp
  autoRenew: boolean;
  scansUsed: number;
  purchaseToken?: string;
  features?: SubscriptionFeatures;
}

// Detailed wine information type
export interface Wine {
  id?: string; // Unique ID for the wine
  name: string; // Wine name
  winery?: string; // Winery/producer name
  producer?: string; // Alternative field for winery
  year?: string; // Year/vintage
  vintage?: string; // Alternative field for year
  region?: string; // Wine region
  grapeVariety?: string; // Grape variety used
  varietal?: string; // Alternative field for grape variety
  type?: string; // Red, white, rosé, etc.
  imageUrl?: string; // URL for wine bottle image
  uploadedImageUrl?: string; // URL of the originally uploaded image
  rating?: {
    score: number;
    source: string;
    review?: string;
  };
  score?: number; // Numerical rating (0-100)
  summary?: string; // Short summary/description
  tastingNotes?: string; // Detailed tasting notes
  webSnippets?: string; // Web search snippets
  pairings?: string[]; // Food pairing suggestions
  additionalReviews?: { source: string; score: number; review: string }[];
  estimatedPrice?: string; // Price estimate as text
  priceEstimate?: { // Structured price estimate
    price: number;
    currency: string;
    confidence: 'high' | 'medium' | 'low';
    lastUpdated?: Date;
  };
  valueRatio?: number; // 1-10 rating of value for money
  valueAssessment?: string; // Description of value assessment
  flavorProfile?: { // Flavor profile characteristics
    body?: number; // 1-5 scale
    acidity?: number; // 1-5 scale
    tannin?: number; // 1-5 scale (for red wines)
    sweetness?: number; // 1-5 scale
    alcohol?: number; // Alcohol percentage
    primaryFlavors?: string[];
  };
  isFromMenu?: boolean; // Whether this wine was identified from a menu
  noBSMode?: boolean; // Whether to use "No BS" mode presentation
  userRating?: number; // User's personal rating
  notes?: string; // User's notes
  dateAdded?: Date; // When the wine was added to the user's list
}

// User preference settings type
export interface UserPreferences {
  language: string;
  tastingNoteLevel: 'basic' | 'intermediate' | 'expert';
  pairingPreferences: string[];
  priceRanges: {
    min: number;
    max: number;
    currency: string;
  };
  favoriteRegions: string[];
  favoriteVarietals: string[];
}

// Upload state tracking
export interface UploadState {
  isLoading: boolean;
  error: string | null;
  progress?: number; // Progress percentage (0-100)
  stage?: string; // Current processing stage description
  useSimpleUI?: boolean; // Whether to use the simple UI instead of the detailed ProcessingStatus component
}

// Processing steps enum
export enum ProcessingStep {
  UPLOADING = 'uploading',
  ANALYZING = 'analyzing',
  GENERATING = 'generating',
  FORMATTING = 'formatting',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Detailed processing state for better UX
export interface ProcessingState {
  isProcessing: boolean;
  currentStep: ProcessingStep;
  progress: number; // Overall progress percentage (0-100)
  stepProgress: number; // Progress within current step (0-100)
  startTime?: Date;
  estimatedTimeRemaining?: number; // In seconds
  statusMessage: string;
  error: string | null;
  jobId?: string;
}

// Wine recommendation with matching score and reasons
export interface WineRecommendation {
  wine: Wine;
  matchScore: number; // 0-100 score indicating how well it matches preferences
  reasons: string[]; // List of reasons why this wine matches preferences
}