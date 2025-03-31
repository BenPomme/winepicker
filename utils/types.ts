// Wine model definition
export interface Wine {
  name: string;
  winery?: string;
  producer?: string;
  year?: string;
  vintage?: string;
  region?: string;
  grapeVariety?: string;
  varietal?: string;
  type?: string;
  imageUrl?: string;
  uploadedImageUrl?: string;
  rating?: {
    score: number;
    source?: string;
    review?: string;
  };
  additionalReviews?: Array<{
    source?: string;
    rating?: number;
    review?: string;
    text?: string;
  }> | string[];
  aiSummary?: string;
  score?: number;
  summary?: string;
}

// Wine rating details
export interface WineRating {
  score: number;
  source: string;
  review?: string;
  price?: number;
  isPriceValue: boolean;
  profile?: Record<string, number>;
}

// API response from OpenAI/Serper processing
export interface AnalyzeWineResponse {
  success: boolean;
  message?: string;
  data?: {
    wines: Wine[];
  };
}

// Types for form state
export interface UploadState {
  isLoading: boolean;
  error: string | null;
  progress?: number;
  stage?: string;
}

// Preference settings
export interface PairingPreferences {
  meat: boolean;
  fish: boolean;
  sweet: boolean;
  dry: boolean;
  fruity: boolean;
  light: boolean;
  'full-bodied': boolean;
} 