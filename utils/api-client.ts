// API client wrapper to handle Firebase function calls
// Try to use Firebase callable functions with HTTP fallback

import { analyzeWineFunction, getAnalysisResultFunction, testOpenAIFunction } from './firebase';

// Firebase Function base URL
const FIREBASE_FUNCTION_URL = 'https://us-central1-winepicker-63daa.cloudfunctions.net/nextApiHandler';

/**
 * Use either Firebase callable function or direct HTTP request as a fallback
 * Fallback to direct HTTP request if the callable function fails with CORS error
 */
async function callWithFallback(
  callableFunction: any, 
  functionPath: string,
  data: any
) {
  try {
    // Only use Firebase callable function
    console.log('Using Firebase callable function...');
    const response = await callableFunction(data);
    console.log('Firebase callable function succeeded');
    return response.data;
  } catch (error: any) {
    console.error('Firebase callable function failed:', error.message);
    // No fallback to avoid CORS issues - just propagate the error
    throw error;
  }
}

/**
 * Uploads an image for wine analysis using Firebase callable function with HTTP fallback
 * @param base64Image The base64 encoded image data
 * @returns The job ID and response data
 */
export async function analyzeWineImage(base64Image: string, locale: string = 'en') {
  try {
    console.log('Calling Firebase function for wine analysis');
    
    // Try callable function first with HTTP fallback
    const response = await callWithFallback(
      analyzeWineFunction,
      'analyze-wine',
      { image: base64Image, locale }
    );
    
    console.log('API Response received:', response);
    
    // Make sure we have all required fields for Wine objects
    if (response?.data?.wines) {
      console.log('Normalizing wine data fields');
      
      response.data.wines = response.data.wines.map((wine: any) => {
        // Ensure consistency between field names without overriding real data
        console.log(`Processing wine: ${wine.name}, score: ${wine.score}, snippets: ${wine.webSnippets ? 'present' : 'missing'}`);
        
        return {
          ...wine,
          winery: wine.producer || wine.winery || 'Unknown Producer',
          year: wine.vintage || wine.year || '',
          grapeVariety: wine.varietal || wine.grapeVariety || '',
          summary: wine.tastingNotes || wine.summary || '',
          // Keep original values from the server
          webSnippets: wine.webSnippets || '',
          score: wine.score || 0,
        };
      });
    }
    
    return response;
  } catch (error) {
    console.error('Error analyzing wine image:', error);
    throw error;
  }
}

/**
 * Tests API connectivity using Firebase callable function with HTTP fallback
 * @returns Test results with API status information
 */
export async function testApiConnection() {
  try {
    console.log('Testing API connectivity...');
    
    // Try callable function first with HTTP fallback
    const data = await callWithFallback(
      testOpenAIFunction,
      'test-connection',
      {}
    );
    
    return {
      success: true,
      data,
      message: 'API connection test successful'
    };
    
  } catch (error) {
    console.error('Error testing API connection:', error);
    throw error;
  }
}

/**
 * Gets analysis results for a job using Firebase callable function with HTTP fallback
 * @param jobId The job ID to check
 * @returns The analysis results
 */
export async function getAnalysisResult(jobId: string) {
  try {
    console.log(`Fetching analysis result for job ID: ${jobId}`);
    
    // Try callable function first with HTTP fallback
    return await callWithFallback(
      getAnalysisResultFunction,
      'get-analysis-result',
      { jobId }
    );
    
  } catch (error) {
    console.error('Error getting analysis result:', error);
    throw error;
  }
}