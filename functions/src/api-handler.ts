import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

// Use the initialized instances from index.ts - these references should be available to all modules
const db = admin.firestore();
const storage = admin.storage();
const bucket = storage.bucket();

// Initialize OpenAI - prioritize Firebase config over environment variables
const openai = new OpenAI({
  apiKey: functions.config().openai?.apikey || process.env.OPENAI_API_KEY || ''
});

// Log API key status (without revealing the key itself)
console.log("API HANDLER - OpenAI API KEY STATUS:");
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

// Handler for Next.js API routes with proper CORS configuration
export const nextApiHandler = functions
  .region('us-central1')
  .runWith({
    invoker: 'public'  // Allow public access without authentication
  })
  .https.onRequest(async (req, res) => {
    // Debugging: log all request details
    console.log('Full request details:', {
      origin: req.headers.origin,
      host: req.headers.host,
      referer: req.headers.referer,
      method: req.method,
      path: req.path,
      url: req.url
    });
    
    // Apply CORS headers manually (more permissive for debugging)
    const origin = req.headers.origin;
    
    // Log the origin for debugging
    console.log(`Request Origin: ${origin || 'No origin header'}`);
    
    if (origin) {
      // During troubleshooting, allow any origin
      res.set('Access-Control-Allow-Origin', origin);
      console.log(`Setting Access-Control-Allow-Origin to: ${origin}`);
    } else {
      // Default fallback
      res.set('Access-Control-Allow-Origin', 'https://winepicker-63daa.web.app');
      console.log('No origin header, using default');
    }
    
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-job-id, Access-Control-Allow-Origin');
    res.set('Access-Control-Expose-Headers', 'x-job-id');
    res.set('Access-Control-Max-Age', '3600');
    res.set('Access-Control-Allow-Credentials', 'true');
    
    // Handle OPTIONS (preflight) requests
    if (req.method === 'OPTIONS') {
      console.log('Handling OPTIONS preflight request');
      res.status(204).send('');
      return;
    }
    
    // Log request details
    console.log(`API Request:`, {
      origin: req.headers.origin || 'none',
      method: req.method,
      path: req.path,
      url: req.url,
      originalUrl: req.originalUrl
    });

    // Extract the API path from the request URL - handle both formats
    // Format 1: /api/test-connection
    // Format 2: /test-connection (without /api/ prefix)
    let path = req.path.replace(/^\/api\//, '');
    
    // Handle root path case ("/")
    if (req.path === '/' && req.query.action) {
      path = String(req.query.action);
    }
    
    console.log(`API request processed: path="${path}", original path="${req.path}", action query param="${req.query.action || 'none'}"`);

    // Route the request to the appropriate handler
    switch (path) {
      case 'analyze-wine':
      case 'analyze-wine-openai': // Handle the analyze-wine-openai path too
        console.log(`Routing request for '${path}' to analyze-wine handler`);
        await handleAnalyzeWine(req, res);
        break;
      case 'get-analysis-result':
        console.log(`Routing request for '${path}' to get-analysis-result handler`);
        await handleGetAnalysisResult(req, res);
        break;
      case 'test-connection':
      case 'test':  // Add alternative path
      case 'status': // Add another alternative path
      case 'openai-test': // Add direct test path for OpenAI API
        console.log(`Routing request for '${path}' to test-connection handler`);
        await handleTestConnection(req, res);
        break;
      case 'key-status': // New endpoint to check API key status without making OpenAI call
        console.log(`Routing request for '${path}' to key-status handler`);
        res.status(200).json({
          status: 'success',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'unknown',
          apiKeyStatus: {
            fromFirebaseConfig: !!functions.config().openai?.apikey,
            fromEnvVar: !!process.env.OPENAI_API_KEY,
            isConfigured: !!openai.apiKey,
            keyLength: openai.apiKey?.length || 0
          }
        });
        break;
      default:
        // Special handling for when someone tries to access just the function URL directly
        if (req.path === '/' || !path) {
          console.log('Root path accessed, serving test-connection endpoint');
          await handleTestConnection(req, res);
          break;
        }
        
        console.log(`Unhandled API path: ${path}`);
        res.status(404).json({ 
          error: 'API endpoint not found',
          message: `Path "${path}" is not a valid API endpoint`,
          availableEndpoints: ['analyze-wine', 'get-analysis-result', 'test-connection', 'test', 'status'],
          requestInfo: {
            path: req.path,
            url: req.url,
            method: req.method
          }
        });
        break;
    }
  });

// Handler for analyze-wine endpoint
async function handleAnalyzeWine(req: functions.https.Request, res: functions.Response) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      status: 'error', 
      message: 'Method not allowed',
      jobId: '' 
    });
  }

  // Generate a unique ID for this analysis job
  const jobId = uuidv4();
  const requestId = uuidv4();
  console.log(`[${requestId}] [${jobId}] Starting wine analysis process...`);

  try {
    const { image, locale = 'en' } = req.body;
    console.log(`[${requestId}] [${jobId}] Processing in locale: ${locale}`);
    
    if (!image) {
      throw new functions.https.HttpsError('invalid-argument', 'No image provided');
    }

    // Set the job ID in the response headers
    res.set('x-job-id', jobId);

    let imageUrl = '';
    
    try {
      // Only try to use Firestore if it's available
      if (db) {
        // Create document in Firestore for tracking job status
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
        
        // Upload the file
        await file.save(buffer, {
          metadata: {
            contentType: 'image/jpeg'
          }
        });
        
        // Set public access to file first
        await file.makePublic();
        
        // Then get the public URL (without tokens, since we made it public)
        imageUrl = `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(file.name)}`;
        
        console.log(`Generated public image URL: ${imageUrl}`);
      } else {
        // Fallback to using a data URL
        imageUrl = `data:image/jpeg;base64,${image.includes(',') ? image.split(',')[1] : image}`;
      }
      
      // Update job status if Firestore is available
      if (db) {
        // Store only the image URL reference, not the actual image data
        await db.collection('jobs').doc(jobId).update({
          status: 'processing',
          // Store only the URL, never raw image data in Firestore
          imageUrl: imageUrl.startsWith('data:') ? 'image_uploaded_as_data_url' : imageUrl,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          processingStartedAt: admin.firestore.FieldValue.serverTimestamp(),
          locale // Store the locale with the job
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

    // Analyze the image using OpenAI
    console.log(`[${requestId}] [${jobId}] Analyzing image with OpenAI in locale: ${locale}...`);
    
    // Get language instructions based on locale
    let languageInstructions = '';
    if (locale === 'fr') {
      languageInstructions = 'Respond in French. ';
    } else if (locale === 'zh') {
      languageInstructions = 'Respond in Simplified Chinese. ';
    } else if (locale === 'ar') {
      languageInstructions = 'Respond in Arabic. ';
    }
    
    // Call OpenAI Vision API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1000,
      messages: [
        {
          role: "system",
          content: `${languageInstructions}You are a wine expert assistant that can identify wines from images of bottles or labels. For each wine detected in the image, provide detailed information in the following format:\n\n**Producer/Winery**: [Producer name]\n**Name**: [Wine name]\n**Vintage**: [Year]\n**Region**: [Region/Appellation]\n**Grape Varieties**: [Grape varieties]\n**Tasting Notes**: [Detailed tasting notes]\n**Score**: [Rating out of 100]\n**Price**: [Price if visible]\n\nIf multiple wines are visible in the image, analyze each one separately with the same format.`
        },
        {
          role: "user",
          content: [
            { type: "text", text: `${languageInstructions}Identify all wines visible in this image and provide details about each one. If there are multiple wines, analyze each one separately.` },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ]
    });

    // Process OpenAI response
    const wineAnalysis = completion.choices[0]?.message?.content || '';
    console.log(`[${requestId}] [${jobId}] OpenAI analysis complete`);
    
    // Parse the analysis into structured data
    const wines = parseWineDetails(wineAnalysis, requestId, jobId);
    
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
      
      return res.status(200).json({ 
        jobId, 
        status: 'completed', 
        data: { wines: [] } 
      });
    }

    console.log(`[${requestId}] [${jobId}] Detected ${wines.length} wines in the image`);
    
    // Store results in Firestore if available, but avoid storing large data
    if (db) {
      console.log(`[${requestId}] [${jobId}] Storing results in Firestore...`);
      
      try {
        // Extract only essential data for storage in Firestore
        const essentialWineData = wines.map(wine => ({
          name: wine.name || '',
          vintage: wine.vintage || '',
          producer: wine.producer || '',
          region: wine.region || '',
          grapeVariety: wine.grapeVariety || '',
          score: wine.score,
          tastingNotes: (wine.tastingNotes || '').substring(0, 500),
          price: wine.price,
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
            wineCount: wines.length,
            wineNames: wines.map(w => w.name || 'Unknown wine'),
            message: 'Full data exceeded size limits. Only basic information is available.'
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    console.log(`[${requestId}] [${jobId}] Analysis completed successfully`);
    
    // Return the job ID, status, and locale
    return res.status(200).json({ 
      jobId, 
      status: 'completed',
      locale: locale || 'en', // Include the locale in the response 
      data: { 
        wines,
        imageUrl,
        locale: locale || 'en' // Include locale in data as well for compatibility
      } 
    });
  } catch (error: any) {
    console.error(`Error processing wine analysis:`, error);
    
    // Return error response
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to process image',
      jobId
    });
  }
}

// Handler for get-analysis-result endpoint
async function handleGetAnalysisResult(req: functions.https.Request, res: functions.Response) {
  try {
    const jobId = req.query.jobId as string;
    
    if (!jobId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'No job ID provided' 
      });
    }

    // Only try to use Firestore if it's available
    if (db) {
      try {
        // Get the main job document
        const docRef = db.collection('jobs').doc(jobId);
        const doc = await docRef.get();
        
        if (!doc.exists) {
          return res.status(404).json({ status: 'not_found', data: null });
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
              
              // Combine the data from both documents and include locale
              return res.status(200).json({
                status: jobData.status,
                locale: jobData.locale || 'en', // Include the locale in the response
                data: {
                  wines: detailsData?.wines || [],
                  imageUrl: jobData.resultSummary?.imageUrl || jobData.imageUrl,
                  completedAt: jobData.completedAt,
                  locale: jobData.locale || 'en' // Include locale in data as well for compatibility
                }
              });
            }
          } catch (detailsError) {
            console.error(`Error retrieving details for job ${jobId}:`, detailsError);
            // Continue with main document data if details retrieval fails
          }
          
          // If we have resultSummary but couldn't get details, return that
          if (jobData.resultSummary) {
            return res.status(200).json({
              status: jobData.status,
              locale: jobData.locale || 'en', // Include the locale in the response
              data: {
                wines: jobData.resultSummary.wineNames.map((name: string) => ({ name })),
                imageUrl: jobData.resultSummary.imageUrl,
                message: 'Limited data available. Full details could not be retrieved.',
                locale: jobData.locale || 'en' // Include locale in data as well for compatibility
              }
            });
          }
          
          // Fall back to result or resultMinimal if they exist
          return res.status(200).json({
            status: jobData.status,
            locale: jobData.locale || 'en', // Include the locale in the response
            data: {
              ...(jobData.result || jobData.resultMinimal || {
                wines: [],
                message: 'Wine data was processed but details are not available.'
              }),
              locale: jobData.locale || 'en' // Include locale in data as well for compatibility
            }
          });
        }
        
        // For jobs that aren't completed, return the status and include locale
        return res.status(200).json({
          status: jobData?.status || 'unknown',
          locale: jobData?.locale || 'en', // Include the locale in the response
          data: {
            ...(jobData?.result || null),
            locale: jobData?.locale || 'en' // Include locale in data as well for compatibility
          }
        });
      } catch (error) {
        console.error('Error retrieving from Firestore:', error);
        // Fall through to the default response
      }
    }
    
    // If Firestore not available or error occurred, return a not_found status
    return res.status(404).json({ 
      status: 'not_found', 
      locale: 'en', // Default to English if we can't retrieve the locale
      data: {
        locale: 'en', // Include locale in data as well for compatibility
        message: "Firestore not available for job tracking"
      }
    });
  } catch (error: any) {
    console.error('Error retrieving analysis result:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to retrieve analysis result'
    });
  }
}

// Handler for test-connection endpoint to verify API connections
async function handleTestConnection(req: functions.https.Request, res: functions.Response) {
  try {
    console.log('Testing API connections...');
    
    // Test OpenAI API - make a simple request
    const testMessage = "This is a test to verify OpenAI API connection. Please respond with 'OpenAI API is working'.";
    
    try {
      // Test OpenAI connection with a simple completion
      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: testMessage }],
        model: "gpt-3.5-turbo",
        max_tokens: 20,
        temperature: 0.5
      });
      
      const openaiStatus = {
        success: true,
        message: completion.choices[0]?.message?.content || "Response received but empty",
        model: completion.model,
        apiKeyConfigured: !!openai.apiKey,
        apiKeyLength: openai.apiKey?.length || 0
      };
      
      // Test Firestore if available
      let firestoreStatus = { available: false, message: "Firestore not initialized" };
      if (db) {
        try {
          // Create a test document
          const testDoc = await db.collection('test_connections').add({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            test: "Connection test"
          });
          
          // Delete it immediately
          await testDoc.delete();
          
          firestoreStatus = { 
            available: true, 
            message: "Successfully wrote and deleted test document" 
          };
        } catch (firestoreError: any) {
          firestoreStatus = { 
            available: false, 
            message: `Firestore error: ${firestoreError.message || 'Unknown error'}` 
          };
        }
      }
      
      // Return success with all status info
      return res.status(200).json({
        status: 'success',
        openai: openaiStatus,
        firestore: firestoreStatus,
        timestamp: new Date().toISOString()
      });
      
    } catch (openaiError: any) {
      console.error('OpenAI API test failed:', openaiError);
      
      // Return error with detailed information
      return res.status(500).json({
        status: 'error',
        error: {
          message: openaiError.message || 'OpenAI API test failed',
          code: openaiError.code || 'unknown',
          type: openaiError.type || 'api_error',
          apiKeyConfigured: !!openai.apiKey,
          apiKeyLength: openai.apiKey?.length || 0
        },
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error: any) {
    console.error('Error in test connection handler:', error);
    
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Test connection failed',
      timestamp: new Date().toISOString()
    });
  }
}

// Helper function to parse the wine details
function parseWineDetails(analysis: string, requestId: string, jobId: string): any[] {
  console.log(`[${requestId}] [${jobId}] Parsing wine details from analysis:`, analysis);
  
  // Split the analysis into sections for each wine
  const wineSections = analysis.split(/(?=\*\*Producer\/Winery\*\*:)/);
  
  return wineSections.filter(section => section.trim()).map(section => {
    const wine: any = {
      producer: '',
      name: '',
      vintage: '',
      region: '',
      grapeVariety: '',
      tastingNotes: '',
      score: 0,
      price: ''
    };

    // Extract producer
    const producerMatch = section.match(/\*\*Producer\/Winery\*\*:\s*([^*\n]+)/);
    if (producerMatch) {
      wine.producer = producerMatch[1].trim();
    }

    // Extract name
    const nameMatch = section.match(/\*\*Name\*\*:\s*([^*\n]+)/);
    if (nameMatch) {
      wine.name = nameMatch[1].trim();
    }

    // Extract vintage
    const vintageMatch = section.match(/\*\*Vintage\*\*:\s*([^*\n]+)/);
    if (vintageMatch) {
      wine.vintage = vintageMatch[1].trim();
    }

    // Extract region
    const regionMatch = section.match(/\*\*Region\*\*:\s*([^*\n]+)/);
    if (regionMatch) {
      wine.region = regionMatch[1].trim();
    }

    // Extract grape varieties
    const grapeMatch = section.match(/\*\*Grape Varieties\*\*:\s*([^*\n]+)/);
    if (grapeMatch) {
      wine.grapeVariety = grapeMatch[1].trim();
    }

    // Extract tasting notes
    const tastingMatch = section.match(/\*\*Tasting Notes\*\*:\s*([^*\n]+)/);
    if (tastingMatch) {
      wine.tastingNotes = tastingMatch[1].trim();
    }

    // Extract score
    const scoreMatch = section.match(/\*\*Score\*\*:\s*(\d+)/);
    if (scoreMatch) {
      wine.score = parseInt(scoreMatch[1]);
    }

    // Extract price
    const priceMatch = section.match(/\*\*Price\*\*:\s*([^*\n]+)/);
    if (priceMatch) {
      wine.price = priceMatch[1].trim();
    }

    return wine;
  });
}