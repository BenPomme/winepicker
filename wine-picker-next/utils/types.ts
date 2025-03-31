// Wine model definition
export interface Wine {
  name: string;
  winery?: string;
  year?: string;
  region?: string;
  grapeVariety?: string;
  type?: string;
  rawText?: string;
  rating: WineRating;
  webComments: string[];
  userRating?: number;
  pairingScores: Record<string, number>;
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
  progress: number;
  stage: string;
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