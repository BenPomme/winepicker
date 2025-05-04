import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

// Initialize Firebase Admin
try {
  admin.initializeApp();
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  // If already initialized, use that app
  console.log('Firebase admin already initialized or error:', error);
}

// Initialize Firestore and Storage only if needed in a try-catch to handle API not enabled errors
let db: FirebaseFirestore.Firestore | null = null;
let storage: admin.storage.Storage | null = null;
let bucket: any = null; // Use any type for the bucket

try {
  db = admin.firestore();
  storage = admin.storage();
  bucket = storage.bucket();
  console.log('Firestore and Storage initialized successfully');
} catch (error) {
  console.error('Error initializing Firestore or Storage:', error);
}

// Load OpenAI API key from Firebase config or environment variable
const openai = new OpenAI({
  apiKey: functions.config().openai?.apikey || process.env.OPENAI_API_KEY || ""
});

// Log API key status (without revealing the key)
console.log("OpenAI API KEY STATUS:");
console.log("-----------------------------------------");
console.log("1. Firebase Config API Key Status:", 
  functions.config().openai?.apikey ? 
  `✅ Found in Firebase config (length: ${functions.config().openai.apikey.length})` : 
  "❌ Not found in Firebase config");
console.log("2. Environment Variable API Key Status:", 
  process.env.OPENAI_API_KEY ? 
  `✅ Found in environment variables (length: ${process.env.OPENAI_API_KEY.length})` : 
  "❌ Not found in environment variables");

// Log which key is actually being used
console.log("3. ACTUAL API KEY BEING USED:", 
  openai.apiKey ? 
  `✅ API key is configured (length: ${openai.apiKey.length})` : 
  "❌ NO VALID API KEY FOUND!");
console.log("-----------------------------------------");

// Export the API handler
export { nextApiHandler } from './api-handler';

// Import functions
import { testWebSnippets } from './dummy';
import { getPriceEstimate } from './price-estimate';

// Export the functions for external use
export { testWebSnippets, getPriceEstimate };

// Add a test function to verify web snippet retrieval works
export const testWebSearchReal = functions
  .region('us-central1')
  .runWith({
    invoker: 'public'  // Allow public access without authentication
  })
  .https.onCall(async (data, context) => {
    try {
      const { wine } = data;
      
      if (!wine || !wine.name) {
        throw new functions.https.HttpsError('invalid-argument', 'No wine information provided');
      }
      
      console.log('Testing web search for wine:', wine.name);
      
      // Implement direct web search here to bypass deployment issues
      const wineDescription = `${wine.vintage || ''} ${wine.producer || ''} ${wine.name || ''} ${wine.region || ''} ${wine.varietal || ''}`.trim();
      const searchQuery = `${wineDescription} wine review tasting notes rating`;
      
      console.log(`Search query: ${searchQuery}`);
      
      // Use OpenAI's web search capability with gpt-4o-search-preview model
      const webSearchResponse = await openai.chat.completions.create({
        model: "gpt-4o-search-preview", // Using search-enabled model
        web_search_options: {}, // Enable web search
        messages: [
          {
            role: "system",
            content: `You are a wine review expert. SEARCH THE WEB to find REAL reviews, ratings, and information about this wine: "${wineDescription}". 
          
ONLY return ACTUAL direct quotes from reviews that exist on the web. Include quotes and snippets from ANY reliable source discussing this wine.

For each real web snippet you find, format it as:
Source Name: "Direct quote from the source" [Include rating if available]

IMPORTANT GUIDELINES:
- ONLY include actual, real text from the web - never invent or generate content
- For EACH snippet, include the exact SOURCE NAME followed by a direct QUOTE
- Use ANY legit source - wine publications, retailers, blogs, forums, auction sites
- If you can't find specific reviews for this exact wine and vintage, use any available real information about similar vintages from the same producer
- Return 3-6 different sources if possible, preferably from different sites
- For lesser-known wines, find what's actually available - even if just basic retailer descriptions`
          },
          {
            role: "user",
            content: `I need REAL wine reviews from the web for: ${searchQuery}. 
          
Search broadly and return ACTUAL quotes and content - never invent reviews.

Format each as "Source: Quote" with specific reviewer names and actual text.`
          }
        ],
        max_tokens: 800
      });
      
      const content = webSearchResponse.choices[0]?.message?.content || '';
      console.log('Full content from OpenAI web search:', content);
      
      return {
        success: true,
        message: "Web search completed",
        wine: wine,
        snippets: content
      };
    } catch (error: any) {
      console.error('Web search test failed:', error);
      
      return {
        success: false,
        message: "Web search failed",
        error: error.message
      };
    }
  });

// No longer using hardcoded snippets

// CORS configuration is now applied within each function handler
// to ensure proper handling of preflight requests

// Add a test function to verify OpenAI API key is working
export const testOpenAI = functions
  .region('us-central1')
  .runWith({
    invoker: 'public'  // Allow public access without authentication
  })
  .https.onCall(async (data, context) => {
    try {
      console.log('Testing OpenAI API key...');
      
      // Check which source provided the API key
      const envKeyLength = process.env.OPENAI_API_KEY?.length || 0;
      const configKeyLength = functions.config().openai?.apikey?.length || 0;
      const activeKey = openai.apiKey || '';
      
      console.log('API key sources:');
      console.log('- Environment variable length:', envKeyLength);
      console.log('- Firebase config length:', configKeyLength);
      console.log('- Active key length used by client:', activeKey.length);
      
      if (activeKey.length < 20) {
        throw new Error('No valid OpenAI API key found');
      }
      
      // Attempt a simple completion to test the key
      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: "Hello, this is a test message. Reply with 'OpenAI is working.'" }],
        model: "gpt-3.5-turbo",
        max_tokens: 10
      });
      
      console.log('OpenAI test completed successfully!');
      
      return {
        success: true,
        message: "OpenAI API connection working",
        source: envKeyLength > 0 ? 'environment' : 'firebase_config',
        response: completion.choices[0]?.message?.content || "No response"
      };
    } catch (error: any) {
      console.error('OpenAI test failed:', error);
      
      return {
        success: false,
        message: "OpenAI API connection failed",
        error: error.message
      };
    }
  });

// Cloud Function to analyze wine from image - this is the one that should be called from the frontend
export const analyzeWine = functions
  .region('us-central1')
  .runWith({
    invoker: 'public'  // Allow public access without authentication
  })
  .https.onCall(async (data, context) => {
  try {
    const { image } = data;
    
    if (!image) {
      throw new functions.https.HttpsError('invalid-argument', 'No image provided');
    }

    // Generate a unique ID for this analysis job
    const jobId = uuidv4();
    const requestId = uuidv4();
    console.log(`[${requestId}] [${jobId}] Starting wine analysis process...`);

    let imageUrl = '';
    
    try {
      // Only try to use Firestore if it's available
      if (db) {
        // Create document in Firestore for tracking job status
        // Add size limit warning to avoid large documents
        await db.collection('jobs').doc(jobId).set({
          status: 'uploading',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          requestId,
          // Important metadata field to indicate we should be careful about document size
          metaData: {
            sizeLimitEnforced: true,
            version: '1.0.1'
          }
        });
      }
      
      // Handle image storage - either use Firebase Storage or a data URL
      if (bucket) {
        // Upload image to Firebase Storage
        console.log(`[${requestId}] [${jobId}] Uploading image to Firebase Storage...`);
        const imageData = image.includes(',') ? image.split(',')[1] : image;
        const buffer = Buffer.from(imageData, 'base64');
        const file = bucket.file(`wine-images/${jobId}.jpg`);
        
        await file.save(buffer, {
          metadata: {
            contentType: 'image/jpeg'
          }
        });

        // Set public access to file first
        await file.makePublic();
        
        // Then get the public URL (without tokens, since we made it public)
        imageUrl = `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(file.name)}`;
      } else {
        // Fallback to using a data URL
        imageUrl = `data:image/jpeg;base64,${image.includes(',') ? image.split(',')[1] : image}`;
      }
      
      // Update job status if Firestore is available
      if (db) {
        // Store only the image URL reference, not the actual image data
        // to prevent exceeding Firestore document size limits
        await db.collection('jobs').doc(jobId).update({
          status: 'processing',
          // Store only the URL, never raw image data in Firestore
          imageUrl: imageUrl.startsWith('data:') ? 'image_uploaded_as_data_url' : imageUrl,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          processingStartedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    } catch (error) {
      console.error(`[${requestId}] [${jobId}] Error with storage/database:`, error);
      // Continue processing even if storage/database fails
    }
    
    // Direct analysis without storage if URL is empty
    if (!imageUrl) {
      imageUrl = `data:image/jpeg;base64,${image.includes(',') ? image.split(',')[1] : image}`;
    }

    // Call OpenAI Vision API to analyze the image
    console.log(`[${requestId}] [${jobId}] Analyzing image with OpenAI...`);
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image and identify ALL wines visible, whether they're bottles, labels, or entries on a wine menu/list.

For each wine, extract these details (if available):
- name: The specific name of the wine
- vintage: The year the wine was produced
- producer: The winery or producer
- region: The region or country of origin
- varietal: The grape variety/varieties

IMPORTANT: 
- If analyzing a wine menu, capture ALL separate wine entries
- Sort wines by likely quality (best wines first) if multiple are found
- List ALL wines visible, up to 10 maximum
- For wine menus, prioritize more expensive or notable wines

Return a JSON array where each object represents a wine with the fields above.
Format: [{wine1}, {wine2}, ...]. Do not include any markdown formatting or backticks.`
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 800,
      temperature: 0.5
    });

    let content = response.choices[0].message.content || '[]';
    console.log("Raw OpenAI Vision API response:", content);

    // Robust JSON Parsing Logic
    // Remove markdown code blocks if present
    if (content.includes("```")) {
      content = content.replace(/```json\s*|\s*```/g, '');
    }
    content = content.trim();

    let parsedWines: any[] = [];
    try {
      if (content.startsWith('[')) {
        parsedWines = JSON.parse(content);
      } else if (content.startsWith('{')) {
        // Handle case where a single object is returned without brackets
        parsedWines = [JSON.parse(content)];
      } else {
        console.warn("OpenAI response is not valid JSON:", content);
        return []; // Return empty if not valid JSON array/object
      }
    } catch (parseError) {
      console.error("Error parsing JSON from OpenAI:", parseError);
      return [];
    }

    console.log(`Identified ${parsedWines.length} potential wine(s)`);

    // Normalize data structure
    const wines = parsedWines.map((wine: any) => ({
      name: wine.name || wine.wine_name || '',
      vintage: wine.vintage || wine.year || '',
      producer: wine.producer || wine.winery || '',
      region: wine.region || '',
      varietal: wine.varietal || wine.grape_variety || '',
      imageUrl: '' // Add empty imageUrl property
    })).filter(wine => wine.name); // Ensure at least a name was found
    
    if (!wines || wines.length === 0) {
      console.log(`[${requestId}] [${jobId}] No wines detected in the image`);
      
      // Update Firestore if available
      if (db) {
        await db.collection('jobs').doc(jobId).update({
          status: 'completed',
          result: { 
            wines: [],
            message: 'No wines detected in the image'
          },
          // Make sure we're not storing the actual image data in Firestore
          imageUrl: imageUrl.startsWith('data:') ? 'image_uploaded_as_data_url' : imageUrl,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      return { jobId, status: 'completed', data: { wines: [] } };
    }

    console.log(`[${requestId}] [${jobId}] Detected ${wines.length} wines in the image`);
    
    // Process each wine
    const processedWines = await Promise.all(wines.map(async (wine) => {
      console.log(`[${requestId}] [${jobId}] Processing wine: ${wine.name}`);
      
      // Get the noBSMode parameter from the job data stored earlier
      const noBSMode = data?.noBSMode || false;
      console.log(`[${requestId}] [${jobId}] No BS Mode flag from request: ${noBSMode ? 'ENABLED' : 'DISABLED'}`);
      
      // Get real web snippets for this wine FIRST
      console.log(`Getting real web content for ${wine.name}`);
      
      // Use OpenAI with web scraper to get real snippets
      const webSnippets = await generateWebSnippets(wine);
      
      // Get wine summary, score, pairings AFTER we have web snippets
      // This allows the AI to use the real reviews when generating the summary
      const { 
        summary, 
        score, 
        pairings, 
        estimatedPrice, 
        valueRatio, 
        valueAssessment,
        flavorProfile 
      } = await generateWineSummary(wine, noBSMode, webSnippets);
      
      // For restaurant menus, add restaurant context if available
      const isRestaurantMenu = wines.length > 2 && !wine.imageUrl;
      
      // Use the actual score from the AI analysis
      console.log(`Using real calculated score: ${score}`);

      return {
        ...wine,
        score: score, // Use the real score from AI analysis
        summary: summary, // Add summary for frontend compatibility
        winery: wine.producer || (wine as any).winery || '', // Ensure winery field exists with type safety
        tastingNotes: summary,
        webSnippets,
        imageUrl,
        // New enhanced details
        pairings,
        estimatedPrice,
        valueRatio,
        valueAssessment,
        flavorProfile,
        isFromMenu: isRestaurantMenu,
        noBSMode: noBSMode // Include No BS Mode flag
      };
    }));

    // Store results in Firestore if available, but avoid storing large data
    if (db) {
      console.log(`[${requestId}] [${jobId}] Storing results in Firestore...`);
      
      try {
        // Extract only essential data for storage in Firestore, exclude base64 data
        const essentialWineData = processedWines.map(wine => ({
          name: wine.name || '',
          vintage: wine.vintage || '',
          producer: wine.producer || '',
          region: wine.region || '',
          varietal: wine.varietal || '',
          score: wine.score,
          // Limit tasting notes to reasonable size
          tastingNotes: (wine.tastingNotes || '').substring(0, 500),
          // Limit web snippets to reasonable size
          webSnippets: (wine.webSnippets || '').substring(0, 500),
          estimatedPrice: wine.estimatedPrice,
          valueRatio: wine.valueRatio,
          // Limit value assessment to reasonable size
          valueAssessment: (wine.valueAssessment || '').substring(0, 200),
          // Include only the most important flavor profile attributes
          flavorProfile: {
            fruitiness: wine.flavorProfile?.fruitiness || 5,
            acidity: wine.flavorProfile?.acidity || 5,
            body: wine.flavorProfile?.body || 5,
          },
          isFromMenu: wine.isFromMenu
        }));
        
        // Store minimal data in the main document
        await db.collection('jobs').doc(jobId).update({
          status: 'completed',
          // Store only an abbreviated summary
          resultSummary: {
            wineCount: essentialWineData.length,
            wineNames: essentialWineData.map(w => w.name),
            imageUrl: imageUrl.startsWith('data:') ? 'image_uploaded_as_data_url' : imageUrl,
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Then store detailed data in a separate document
        // Breaking it up to avoid the 1MB limit
        await db.collection('jobs').doc(`${jobId}_details`).set({
          wines: essentialWineData,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`[${requestId}] [${jobId}] Successfully stored results in separate documents`);
      } catch (error) {
        console.error(`[${requestId}] [${jobId}] Error storing results:`, error);
        
        // Fallback: store absolute minimum data if we hit size limits
        await db.collection('jobs').doc(jobId).update({
          status: 'completed',
          resultMinimal: {
            wineCount: processedWines.length,
            wineNames: processedWines.map(w => w.name || 'Unknown wine'),
            message: 'Full data exceeded size limits. Only basic information is available.'
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    console.log(`[${requestId}] [${jobId}] Analysis completed successfully`);
    
    // Debug the response data before returning
    // Get locale for response
    const locale = data?.locale || 'en';
    
    const responseData = {
      jobId, 
      status: 'completed', 
      locale: locale, // Include the locale in the response 
      data: { 
        wines: processedWines,
        imageUrl,
        locale: locale // Include locale in data as well for compatibility
      }
    };
    
    // Log the full response structure
    console.log('=============== RESPONSE DATA ===============');
    console.log('JOB ID:', jobId);
    console.log('Wines count:', processedWines.length);
    processedWines.forEach((wine, index) => {
      console.log(`Wine ${index + 1}:`);
      console.log('- Name:', wine.name);
      console.log('- Producer/Winery:', wine.producer || wine.winery);
      console.log('- Score:', wine.score);
      console.log('- Web Snippets Length:', wine.webSnippets ? wine.webSnippets.length : 0);
      console.log('- Web Snippets Preview:', wine.webSnippets ? wine.webSnippets.substring(0, 100) : 'No snippets');
      console.log('- Image URL:', wine.imageUrl ? wine.imageUrl.substring(0, 50) + '...' : 'No image URL');
    });
    console.log('============================================');
    
    return responseData;
  } catch (error: any) {
    console.error(`Error processing wine analysis:`, error);
    
    // Provide more detailed error message based on error type
    if (error.code === 'invalid_api_key') {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Invalid OpenAI API key. Please check your API key configuration.'
      );
    } else if (error.status === 401) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication error with OpenAI API. Check your API key.'
      );
    } else if (error.code === 'not-found' || error.message?.includes('not found')) {
      // For Firestore or Storage not found errors
      console.log('Returning empty result instead of error for not found');
      // Return an empty result instead of throwing an error
      return { 
        jobId: uuidv4(), 
        status: 'completed', 
        data: { 
          wines: [],
          message: 'No wines could be detected in the image.'
        } 
      };
    } else {
      throw new functions.https.HttpsError(
        'internal', 
        error.message || 'Failed to process image'
      );
    }
  }
});

// Function to get analysis results by jobId
export const getAnalysisResult = functions
  .region('us-central1')
  .runWith({
    invoker: 'public'  // Allow public access without authentication
  })
  .https.onCall(async (data, context) => {
  try {
    const { jobId } = data;
    
    if (!jobId) {
      throw new functions.https.HttpsError('invalid-argument', 'No job ID provided');
    }

    // Only try to use Firestore if it's available
    if (db) {
      try {
        // Get the main job document
        const docRef = db.collection('jobs').doc(jobId);
        const doc = await docRef.get();
        
        if (!doc.exists) {
          return { status: 'not_found', data: null };
        }
        
        const jobData = doc.data();
        
        // Check if we have detailed data in a separate document
        if (jobData?.status === 'completed') {
          try {
            // Try to get the detailed results from the separate document
            const detailsRef = db.collection('jobs').doc(`${jobId}_details`);
            const detailsDoc = await detailsRef.get();
            
            if (detailsDoc.exists) {
              const detailsData = detailsDoc.data();
              
              // Combine the data from both documents
              return {
                status: jobData.status,
                data: {
                  wines: detailsData?.wines || [],
                  imageUrl: jobData.resultSummary?.imageUrl || jobData.imageUrl,
                  completedAt: jobData.completedAt
                }
              };
            }
          } catch (detailsError) {
            console.error(`Error retrieving details for job ${jobId}:`, detailsError);
            // Continue with main document data if details retrieval fails
          }
          
          // If we have resultSummary but couldn't get details, return that
          if (jobData.resultSummary) {
            return {
              status: jobData.status,
              data: {
                wines: jobData.resultSummary.wineNames.map((name: string) => ({ name })),
                imageUrl: jobData.resultSummary.imageUrl,
                message: 'Limited data available. Full details could not be retrieved.'
              }
            };
          }
          
          // Fall back to result or resultMinimal if they exist
          return {
            status: jobData.status,
            data: jobData.result || jobData.resultMinimal || {
              wines: [],
              message: 'Wine data was processed but details are not available.'
            }
          };
        }
        
        // For jobs that aren't completed, return the status
        return {
          status: jobData?.status || 'unknown',
          data: jobData?.result || null
        };
      } catch (error) {
        console.error('Error retrieving from Firestore:', error);
        // Fall through to the default response
      }
    }
    
    // If Firestore not available or error occurred, return a not_found status
    return { 
      status: 'not_found', 
      data: null,
      message: "Firestore not available for job tracking"
    };
  } catch (error: any) {
    console.error('Error retrieving analysis result:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to retrieve analysis result'
    );
  }
});

// Generate AI-based wine summary, ratings, pairings, and price info
async function generateWineSummary(
  wineInfo: any, 
  noBSMode: boolean = false, 
  webSnippets: string = ''
): Promise<{ 
  summary: string, 
  score: number, 
  pairings: string[],
  estimatedPrice: string,
  valueRatio: number,
  valueAssessment: string,
  flavorProfile: { [key: string]: number }
}> {
  try {
    const vintage = wineInfo.vintage || '';
    const year = (wineInfo as any).year || '';
    const producer = wineInfo.producer || '';
    const winery = (wineInfo as any).winery || '';
    const name = wineInfo.name || '';
    const region = wineInfo.region || '';
    const varietal = wineInfo.varietal || '';
    const grapeVariety = (wineInfo as any).grapeVariety || '';
    
    const wineDescription = `${vintage || year} ${producer || winery} ${name} ${region} ${varietal || grapeVariety}`.trim();
    
    // If the wine already has a score field, use it
    if (wineInfo.score && typeof wineInfo.score === 'number' && wineInfo.score > 0) {
      console.log(`Using existing score ${wineInfo.score} for ${wineInfo.name}`);
    }
    
    // Log whether we have web snippets to work with
    const hasWebSnippets = webSnippets && webSnippets.length > 50;
    console.log(`Generating summary with${hasWebSnippets ? '' : 'out'} web snippets information`);
    
    // Prepare the web snippets section for the prompt
    const webSnippetsSection = hasWebSnippets ? 
      `\n\nHere are real reviews and information from the web about this wine:\n${webSnippets}\n\nUse the information above to inform your assessment.` : 
      `\n\nNo specific web information was found for this wine. Provide an assessment based on your knowledge of similar wines.`;
    
    let prompt = '';
    
    if (noBSMode) {
      prompt = `You are a BRUTALLY HONEST, sarcastic, and slightly insulting wine critic with ABSOLUTELY NO FILTER. You HATE wine snobbery and pretentiousness. 

Wine information: ${wineDescription}${webSnippetsSection}

Based on the above information, please provide:

1. A BRUTALLY HONEST, unfiltered paragraph about this wine. Use profanity if appropriate, be sarcastic, insulting, and totally unfiltered. Make fun of pretentious wine culture. Compare the wine to something non-wine related (e.g., "tastes like your aunt's perfume mixed with bad decisions"). DIRECTLY REFERENCE actual notes and opinions from the web reviews when available.

2. A TRULY HONEST rating on a scale of 0-100. Do NOT inflate the score - be critical and harsh. Most wines should be in the 50-85 range because most wine is NOT special. BASE YOUR SCORE PARTLY ON ACTUAL RATINGS mentioned in the web reviews when available.

3. Food pairing suggestions but make these sarcastic or humorous too (e.g., "Pairs well with getting drunk enough to forget you paid money for this").

4. An estimated price range in USD, but be critical about whether it's worth it. USE ACTUAL PRICES FROM THE WEB REVIEWS when available.

5. A value ratio score from 1-10 where 10 means exceptional value for money and 1 means complete ripoff.

6. A sarcastic value assessment (1-2 sentences mocking the price-to-quality relationship).

7. A flavor profile represented as a JSON object with numerical scores from 1-10 for: fruitiness, acidity, tannin, body, sweetness, and oak. BASE THIS ON FLAVOR DESCRIPTORS from the web reviews when available.

Return your response in this JSON format:
{
  "summary": "your brutally honest summary here",
  "score": numerical_score,
  "pairings": ["sarcastic pairing 1", "sarcastic pairing 2", "sarcastic pairing 3"],
  "estimatedPrice": "$XX - $YY",
  "valueRatio": number,
  "valueAssessment": "sarcastic assessment of value",
  "flavorProfile": {
    "fruitiness": number,
    "acidity": number,
    "tannin": number,
    "body": number,
    "sweetness": number,
    "oak": number
  }
}`;
    } else {
      prompt = `You are a wine expert. 

Wine information: ${wineDescription}${webSnippetsSection}

Based on the above information, please provide:

1. A sophisticated yet concise single-paragraph summary of the characteristics, flavors, and quality of this wine. INCORPORATE SPECIFIC FLAVOR NOTES AND DESCRIPTORS from the web reviews when available. Your summary should reflect the consensus of actual reviews rather than generic descriptions.

2. An estimated rating on a scale of 0-100. If ratings are mentioned in the web reviews, CALCULATE YOUR SCORE BASED ON THOSE ACTUAL RATINGS, converting ratings to the 100-point scale if needed. If no ratings are available, estimate based on the tone and content of reviews.

3. Food pairing suggestions (3-5 specific dishes that would pair well). USE PAIRING RECOMMENDATIONS from the web reviews when available.

4. An estimated price range in USD. USE THE ACTUAL PRICES mentioned in the web reviews when available.

5. A value ratio score from 1-10 where 10 means exceptional value for money and 1 means overpriced. Base this on the relationship between quality (from reviews) and price.

6. A brief value assessment (1-2 sentences explaining the price-to-quality relationship).

7. A flavor profile represented as a JSON object with numerical scores from 1-10 for: fruitiness, acidity, tannin, body, sweetness, and oak. DERIVE THESE VALUES FROM SPECIFIC DESCRIPTORS in the web reviews when available.

Return your response in this JSON format:
{
  "summary": "your summary here",
  "score": numerical_score,
  "pairings": ["dish 1", "dish 2", "dish 3"],
  "estimatedPrice": "$XX - $YY",
  "valueRatio": number,
  "valueAssessment": "brief assessment of value",
  "flavorProfile": {
    "fruitiness": number,
    "acidity": number,
    "tannin": number,
    "body": number,
    "sweetness": number,
    "oak": number
  }
}`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content || '{}';
    const result = JSON.parse(content);
    
    // Log the parsed results
    console.log('SUMMARY - OpenAI response parsed:', {
      summary: !!result.summary,
      score: result.score,
      pairings: Array.isArray(result.pairings) ? result.pairings.length : 'not array',
      estimatedPrice: result.estimatedPrice,
      valueRatio: result.valueRatio,
      flavorProfile: !!result.flavorProfile
    });
    
    const returnData = { 
      summary: result.summary || "No summary available",
      score: result.score || 85,
      pairings: result.pairings || ["Beef dishes", "Hard cheeses", "Roasted vegetables"],
      estimatedPrice: result.estimatedPrice || "$15 - $25",
      valueRatio: result.valueRatio || 5,
      valueAssessment: result.valueAssessment || "Average value for the price point",
      flavorProfile: result.flavorProfile || {
        fruitiness: 5,
        acidity: 5,
        tannin: 5,
        body: 5,
        sweetness: 5,
        oak: 5
      }
    };
    
    console.log('SUMMARY - Returning data with score:', returnData.score);
    return returnData;
  } catch (error) {
    console.error('Error generating wine summary:', error);
    return { 
      summary: "Failed to generate summary", 
      score: 85,
      pairings: ["Beef dishes", "Hard cheeses", "Roasted vegetables"],
      estimatedPrice: "$15 - $25",
      valueRatio: 5,
      valueAssessment: "Average value for the price point",
      flavorProfile: {
        fruitiness: 5,
        acidity: 5,
        tannin: 5,
        body: 5,
        sweetness: 5,
        oak: 5
      }
    };
  }
}

// Generate web snippets for a wine using OpenAI with real web search
async function generateWebSnippets(wineInfo: any): Promise<string> {
  try {
    console.log('SNIPPETS - Input wine info:', JSON.stringify(wineInfo));
    
    const vintage = wineInfo.vintage || '';
    const year = (wineInfo as any).year || '';
    const producer = wineInfo.producer || '';
    const winery = (wineInfo as any).winery || '';
    const name = wineInfo.name || '';
    const region = wineInfo.region || '';
    const varietal = wineInfo.varietal || '';
    const grapeVariety = (wineInfo as any).grapeVariety || '';
    
    const wineDescription = `${vintage || year} ${producer || winery} ${name} ${region} ${varietal || grapeVariety}`.trim();
    console.log('SNIPPETS - Wine description for prompt:', wineDescription);
    
    // Skip generation if we don't have enough information
    if (wineDescription.length < 5 || !wineInfo.name) {
      console.log('Insufficient wine information for web snippets generation');
      return 'No web results found.';
    }
    
    console.log(`Generating web snippets for wine: ${wineDescription}`);
    
    // Create a search query from the wine information
    const searchQuery = `${wineDescription} wine review tasting notes rating`;
    console.log(`Search query: ${searchQuery}`);
    
    // Use OpenAI's web search capability with gpt-4o-search-preview model
    const webSearchResponse = await openai.chat.completions.create({
      model: "gpt-4o-search-preview", // Using search-enabled model
      web_search_options: {}, // Enable web search
      messages: [
        {
          role: "system",
          content: `You are a wine review expert. SEARCH THE WEB to find REAL reviews, ratings, and information about this wine: "${wineDescription}". 
          
ONLY return ACTUAL direct quotes from reviews that exist on the web. Include quotes and snippets from ANY reliable source discussing this wine.

For each real web snippet you find, format it as:
Source Name: "Direct quote from the source" [Include rating if available]

IMPORTANT GUIDELINES:
- ONLY include actual, real text from the web - never invent or generate content
- For EACH snippet, include the exact SOURCE NAME followed by a direct QUOTE
- Use ANY legit source - wine publications, retailers, blogs, forums, auction sites
- If you can't find specific reviews for this exact wine and vintage, use any available real information about similar vintages from the same producer
- Return 3-6 different sources if possible, preferably from different sites
- For lesser-known wines, find what's actually available - even if just basic retailer descriptions`
        },
        {
          role: "user",
          content: `I need REAL wine reviews from the web for: ${searchQuery}. 
          
Search broadly and return ACTUAL quotes and content - never invent reviews.

Format each as "Source: Quote" with specific reviewer names and actual text.`
        }
      ],
      max_tokens: 800
    });

    const content = webSearchResponse.choices[0]?.message?.content || '';
    
    if (!content) {
      console.log('No content returned from OpenAI web search');
      return 'No web results found.';
    }
    
    console.log(`Retrieved web snippets: ${content.substring(0, 100)}...`);
    
    // Validate the response to ensure it has the correct format
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    // Log the full content for debugging
    console.log('Full content from OpenAI web search:', content);
    
    // Check if we got an explicit indication that nothing was found
    if (content.includes("No reliable reviews found") || 
        content.includes("couldn't find any reviews") || 
        content.includes("I was unable to find") ||
        content.includes("I could not find")) {
      console.log('No reviews found indication from API');
      return 'No reliable web snippets found for this wine.';
    }
    
    // Only check for basic formatting - be less strict
    if (lines.length === 0 || !content.includes(':')) {
      console.log('Invalid snippet format received');
      return 'No reliable web snippets found for this wine.';
    }
    
    return content;
  } catch (error) {
    console.error('Error generating web snippets:', error);
    return 'Error retrieving web snippets.';
  }
}