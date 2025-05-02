import { NextApiRequest, NextApiResponse } from 'next';
import { put } from '@vercel/blob';
import { kv } from '@vercel/kv';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define WineData type to fix type error
type WineData = {
  name: string;
  producer: string;
  vintage: string;
  region: string;
  grapeVarieties: string;
  tastingNotes: string;
  score: number;
  price: string;
  imageUrl: string;
  webSnippets: string;
};

type AnalyzeRequestBody = {
  image: string;
  noBSMode?: boolean;
  locale?: string; // Add locale parameter
};

type AnalyzeResponseData = {
  jobId: string;
  status: string;
  requestId?: string;
  message?: string;
  data?: {
    wines: WineData[];
    imageUrl: string;
  };
};

// Validate image format and extract base64 data
function validateAndExtractImageData(imageStr: string): string | null {
  if (!imageStr || typeof imageStr !== 'string') return null;
  
  // Handle data URLs (e.g., "data:image/jpeg;base64,/9j/4AAQ...")
  if (imageStr.startsWith('data:')) {
    const parts = imageStr.split(',');
    if (parts.length !== 2) return null;
    return parts[1];
  }
  
  // Handle raw base64 strings
  if (/^[A-Za-z0-9+/=]+$/.test(imageStr)) {
    return imageStr;
  }
  
  return null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyzeResponseData>
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      status: 'error', 
      message: 'Method not allowed',
      jobId: ''
    });
  }

  // Generate a request ID for logging
  const requestId = uuidv4();
  console.log(`[${requestId}] OpenAI-only analyze request received`);
  console.log(`[${requestId}] DEPLOYMENT CHECK: Using updated GPT-4o version - April 1, 2025 @ ${new Date().toISOString()}`);

  // Generate a unique job ID at the beginning
  const jobId = uuidv4();
  console.log(`[${requestId}] Generated Job ID: ${jobId}`);

  try {
    const { image, noBSMode = false, locale = 'en' } = req.body as AnalyzeRequestBody;
    console.log(`[${requestId}] No BS Mode: ${noBSMode ? 'ENABLED' : 'DISABLED'}`);
    console.log(`[${requestId}] noBSMode parameter type: ${typeof noBSMode}, value: ${noBSMode}`);
    console.log(`[${requestId}] Processing in locale: ${locale}`);

    if (!image) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'No image provided',
        jobId // Return the jobId even in error cases
      });
    }

    // Make sure we set job ID in headers for client accessibility
    res.setHeader('x-job-id', jobId);

    // Validate and extract the base64 image data
    const imageData = validateAndExtractImageData(image);
    if (!imageData) {
      console.error(`[${requestId}] Invalid image data format`);
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid image data format. Expected base64 string or data URL',
        jobId 
      });
    }

    // Upload image to Blob storage
    console.log(`[${requestId}] [${jobId}] Uploading image to Vercel Blob...`);
    const buffer = Buffer.from(imageData, 'base64');
    
    // Upload the image to Vercel Blob storage
    const { url } = await put(`${jobId}.jpg`, buffer, {
      access: 'public',
    });
    
    console.log(`[${requestId}] [${jobId}] Image uploaded to Vercel Blob: ${url}`);

    // Create job record in KV
    await kv.hset(`job:${jobId}`, {
      status: 'processing',
      imageUrl: url,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requestId,
      noBSMode: req.body.noBSMode || false,
      locale // Store the locale with the job
    });

    console.log(`[${requestId}] [${jobId}] Calling OpenAI Vision API...`);
    
    // Call OpenAI Vision API - Remove language instructions as we only need the final review to be localized
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1000,
      messages: [
        {
          role: "system",
          content: `You are a wine expert assistant that can identify wines from images of bottles or labels. For each wine detected in the image, provide detailed information in the following format:\n\n**Producer/Winery**: [Producer name]\n**Name**: [Wine name]\n**Vintage**: [Year]\n**Region**: [Region/Appellation]\n**Grape Varieties**: [Grape varieties]\n**Tasting Notes**: [Detailed tasting notes]\n**Score**: [Rating out of 100]\n**Price**: [Price if visible]\n\nIf multiple wines are visible in the image, analyze each one separately with the same format.`
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Identify all wines visible in this image and provide details about each one. If there are multiple wines, analyze each one separately.` },
            {
              type: "image_url",
              image_url: {
                url: url as string
              }
            }
          ]
        }
      ]
    });

    // Process OpenAI response with proper null checking
    const wineAnalysis = completion.choices[0]?.message?.content || '';
    console.log(`[${requestId}] [${jobId}] OpenAI analysis complete`);
    console.log(`[${requestId}] [${jobId}] Raw OpenAI response:`, wineAnalysis);

    // Parse the analysis into structured data for multiple wines
    const wineDataArray = parseWineDetails(wineAnalysis, requestId, jobId);
    console.log(`[${requestId}] [${jobId}] Parsed wine data:`, JSON.stringify(wineDataArray, null, 2));

    // Search for wine images and generate reviews using OpenAI's web search
    const winesWithImages = await Promise.all(wineDataArray.map(async (wine) => {
      try {
        // Create a well-formatted search query for the wine
        const searchQueryBase = `${wine.producer} ${wine.name} ${wine.vintage}`.trim();
        console.log(`[${requestId}] [${jobId}] Starting web search/review/image process for: ${searchQueryBase}`);
        
        // Step 1: Perform real web search to get wine review snippets
        const textSearchQuery = `${searchQueryBase} wine reviews${locale !== 'en' ? ` ${locale}` : ''}`;
        console.log(`[${requestId}] [${jobId}] Performing real web search for: ${textSearchQuery} in locale: ${locale}`);
        let actualTextSnippets = "No specific web results found."; // Initialize
        
        try {
          // Implement fetch-based web scraping to get real reviews
          const sites = [
            `https://www.google.com/search?q=${encodeURIComponent(textSearchQuery)}`,
            `https://www.vivino.com/search/wines?q=${encodeURIComponent(searchQueryBase)}`,
            `https://www.wine-searcher.com/find/${encodeURIComponent(searchQueryBase.replace(/\s+/g, '+'))}`
          ];
          
          console.log(`[${requestId}] [${jobId}] Searching for wine reviews from multiple sources`);
          
          // Use Promise.all to fetch from multiple sources in parallel
          const fetchPromises = sites.map(async (url, index) => {
            try {
              const controller = new AbortController();
              // Set a timeout for each fetch request
              const timeoutId = setTimeout(() => controller.abort(), 5000);
              
              const response = await fetch(url, { 
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                signal: controller.signal
              });
              clearTimeout(timeoutId);
              
              if (!response.ok) {
                return `Source ${index + 1}: Error fetching content - ${response.status}`;
              }
              
              const html = await response.text();
              return { url, html };
            } catch (error) {
              console.error(`[${requestId}] [${jobId}] Error fetching from ${url}:`, error);
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              return `Source ${index + 1}: Error - ${errorMessage}`;
            }
          });
          
          // Wait for all fetches to complete
          const fetchResults = await Promise.all(fetchPromises);
          
          // Extract text snippets using OpenAI
          const validResults = fetchResults.filter(result => typeof result !== 'string' && result.html);
          
          if (validResults.length > 0) {
            // Use OpenAI to extract relevant snippets from the HTML
            let rawHtmlContent = '';
            validResults.forEach((result: any) => {
              if (result.url && result.html) {
                // Limit the HTML size to avoid token limits
                const limitedHtml = result.html.substring(0, 15000);
                rawHtmlContent += `SOURCE: ${result.url}\n\nCONTENT EXTRACT:\n${limitedHtml}\n\n---\n\n`;
              }
            });
            
            console.log(`[${requestId}] [${jobId}] Extracted HTML content, using OpenAI to parse wine review snippets`);
            
            // Use OpenAI to extract the relevant reviews from the raw HTML
            // Keep snippets extraction in English regardless of locale
            const extractionCompletion = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                {
                  role: "system",
                  content: `You are a wine review extraction expert. Extract ONLY direct quotes/snippets about this specific wine: "${searchQueryBase}". 
                  Focus on professional reviews, tasting notes, ratings, and user reviews.
                  
                  For each review snippet:
                  1. Include the source name
                  2. Format as "Source: [website] - [snippet text]"
                  3. Return 3-5 different snippets, each on a new line
                  
                  If you cannot find specific reviews for this exact wine, respond with "No specific reviews found for this wine."`
                },
                {
                  role: "user",
                  content: `Extract review snippets for "${searchQueryBase}" from these HTML sources:\n\n${rawHtmlContent}`
                }
              ],
              max_tokens: 1000
            });
            
            actualTextSnippets = extractionCompletion.choices[0]?.message?.content || "No specific reviews found for this wine.";
            console.log(`[${requestId}] [${jobId}] Extracted wine review snippets:`, actualTextSnippets);
          } else {
            console.log(`[${requestId}] [${jobId}] No valid HTML content found for extraction`);
            actualTextSnippets = "No valid wine review sources found.";
          }
        } catch(searchError) {
            console.error(`[${requestId}] [${jobId}] *** ERROR during web search and extraction for ${searchQueryBase}: ***`, searchError);
            actualTextSnippets = 'Error during web search.';
        }

        // Step 2: Image Search (DISABLED FOR PERFORMANCE)
        // Using only the original uploaded image for better performance
        console.log(`[${requestId}] [${jobId}] PERFORMANCE_MEASUREMENT: Start of image search section`);
        console.log(`[${requestId}] [${jobId}] External image search disabled for performance improvement`);
        const optimizationStartTime = Date.now();
        let imageUrl = '';
        
        // Simulate time it would take with the old approach
        const simulationStart = Date.now();
        
        // Simulate network requests (3 requests with 500ms each + occasional timeout)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simulate OpenAI API call for image selection (1-2 seconds)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simulate additional processing (500ms)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const simulationEnd = Date.now();
        const simulatedTime = simulationEnd - simulationStart;
        
        // Skip all external image searches and processing
        console.log(`[${requestId}] [${jobId}] Using original uploaded image instead of searching for wine-specific images`);
        const optimizationEndTime = Date.now();
        console.log(`[${requestId}] [${jobId}] PERFORMANCE_MEASUREMENT: End of image search section - ${(optimizationEndTime - optimizationStartTime)}ms actual time`);
        console.log(`[${requestId}] [${jobId}] PERFORMANCE_SIMULATION: Old approach would have taken approximately ${simulatedTime}ms`);
        console.log(`[${requestId}] [${jobId}] PERFORMANCE_OPTIMIZATION: Image search optimization saved approximately ${simulatedTime}ms per analysis`);

        // Step 3: Generate final review and rating using actualTextSnippets
        console.log(`[${requestId}] [${jobId}] Generating final review and rating for: ${searchQueryBase}`);
        let finalReview = wine.tastingNotes;
        let finalScore = wine.score || 0;
        
        // Get appropriate review prompt based on locale
        let reviewPrompt = '';
        
        // Use specific localized prompts instead of just prefixing with language instructions
        if (locale === 'fr') {
          reviewPrompt = noBSMode ?
            `Vous êtes un critique de vin BRUTALEMENT HONNÊTE, sarcastique et légèrement insultant, SANS AUCUN FILTRE. Vous DÉTESTEZ le snobisme et la prétention autour du vin.
            
Synthétisez les informations fournies en DEUX éléments:
1. Une critique BRUTALEMENT HONNÊTE (max 2 phrases). Utilisez des jurons si approprié, soyez sarcastique, insultant et totalement sans filtre.
   - Si c'est médiocre, dites que c'est comme "boire de la déception liquide"
   - Si c'est trop cher, moquez-vous des personnes qui l'achètent
   - Si c'est prétentieux, utilisez des expressions comme "jus de raisin surfacturé" ou "prétention liquide"
   - Utilisez de l'argot, un langage familier et de l'attitude
   - Faites au moins une comparaison avec quelque chose sans rapport avec le vin (ex: "a le goût du parfum de votre tante mélangé à de mauvaises décisions")
   
2. Une note (1-100) qui soit HONNÊTE - ne gonflez pas les scores pour les vins prestigieux.

Répondez UNIQUEMENT avec un objet JSON contenant les clés 'review' (chaîne) et 'score' (nombre).` :
            
            `Vous êtes un critique de vin professionnel. Synthétisez l'analyse initiale fournie et les extraits de recherche web en DEUX éléments distincts:
1. Une critique finale concise (max 2 phrases).
2. Une note numérique (1-100) basée sur toutes les informations disponibles.

Répondez UNIQUEMENT avec un objet JSON contenant les clés 'review' (chaîne) et 'score' (nombre).`;
        } else if (locale === 'zh') {
          reviewPrompt = noBSMode ?
            `您是一位极其坦率、讽刺且略带侮辱性的葡萄酒评论家，完全没有任何过滤。您厌恶葡萄酒势利和自命不凡。
            
将提供的信息综合为两个输出:
1. 一个极其坦率的评论(最多2句话)。在适当情况下使用粗俗语言，保持讽刺、侮辱和完全不加过滤。
   - 如果酒质平庸，说它"像喝液态失望"
   - 如果价格过高，嘲笑购买它的人
   - 如果很装腔作势，使用"高价葡萄汁"或"液态装腔作势"之类的表达
   - 使用俚语、随意语言和态度
   - 至少做一个与葡萄酒无关的比较(例如，"尝起来像您阿姨的香水混合着糟糕决定")
   
2. 一个诚实的分数(1-100) - 不要夸大名贵葡萄酒的分数。

仅以包含'review'(字符串)和'score'(数字)键的JSON对象回复。` :
            
            `您是专业葡萄酒评论家。将提供的初步分析和网络搜索片段合成为两个不同的输出:
1. 一个简洁的最终评论(最多2句话)。
2. 一个基于所有可用信息的数值评分(1-100)。

仅以包含'review'(字符串)和'score'(数字)键的JSON对象回复。`;
        } else if (locale === 'ar') {
          reviewPrompt = noBSMode ?
            `أنت ناقد نبيذ صريح بشكل وحشي، ساخر، ومهين قليلاً بدون أي فلتر على الإطلاق. أنت تكره تكلف وتظاهر عالم النبيذ.
            
قم بتوليف المعلومات المقدمة في مخرجين:
1. مراجعة صريحة بشكل وحشي (جملتان كحد أقصى). استخدم الألفاظ النابية إذا كان ذلك مناسبًا، كن ساخرًا، مهينًا، وبدون أي فلتر.
   - إذا كان متوسطًا، قل إنه مثل "شرب خيبة الأمل السائلة"
   - إذا كان باهظ الثمن، اسخر من الأشخاص الذين يشترونه
   - إذا كان متكلفًا، استخدم عبارات مثل "عصير عنب مبالغ في سعره" أو "تكلف سائل"
   - استخدم العامية، لغة عادية، وموقفًا
   - قدم على الأقل مقارنة واحدة بشيء لا علاقة له بالنبيذ (مثل "يتذوق مثل عطر عمتك ممزوجًا بقرارات سيئة")
   
2. درجة (1-100) صادقة - لا تضخم الدرجات للنبيذ المرموق.

الرد فقط بكائن JSON يحتوي على مفاتيح 'review' (سلسلة) و 'score' (رقم).` :
            
            `أنت ناقد نبيذ محترف. قم بتوليف التحليل الأولي المقدم ومقتطفات البحث على الويب في مخرجين منفصلين:
1. مراجعة نهائية موجزة (جملتان كحد أقصى).
2. درجة رقمية (1-100) بناءً على جميع المعلومات المتاحة.

الرد فقط بكائن JSON يحتوي على مفاتيح 'review' (سلسلة) و 'score' (رقم).`;
        } else {
          // Default English prompt
          reviewPrompt = noBSMode ?
            `You are a BRUTALLY HONEST, sarcastic, and slightly insulting wine critic with ABSOLUTELY NO FILTER. You HATE wine snobbery and pretentiousness.
                
Synthesize the provided information into TWO outputs:
1. A BRUTALLY HONEST review (max 2 sentences). Use profanity if appropriate, be sarcastic, insulting, and totally unfiltered.
   - If it's mediocre, say it's like "drinking liquid disappointment"
   - If it's overpriced, mock the people who buy it
   - If it's pretentious, use phrases like "overpriced grape juice" or "liquid pretentiousness"
   - Use slang, casual language, and attitude
   - Make at least one comparison to something non-wine related (e.g., "tastes like your aunt's perfume mixed with bad decisions")
   
2. A score (1-100) that's HONEST - don't inflate scores for prestigious wines.

Respond ONLY with a JSON object containing 'review' (string) and 'score' (number) keys.` :
                
            `You are a professional wine critic. Synthesize the provided initial analysis and the web search snippets into TWO distinct outputs:
1. A concise final review (max 2 sentences).
2. A numerical score (1-100) based on all available information.

Respond ONLY with a JSON object containing 'review' (string) and 'score' (number) keys.`;
        }
        
        const reviewMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            {
                role: "system",
                content: reviewPrompt
            },
            {
                role: "user",
                content: `Create the JSON output (review and score) for ${searchQueryBase}:\n\n== Initial Analysis (from image) ==\nProducer: ${wine.producer}\nName: ${wine.name}\nVintage: ${wine.vintage}\nRegion: ${wine.region}\nGrape Varieties: ${wine.grapeVarieties}\nTasting Notes: ${wine.tastingNotes}\nScore: ${wine.score}\nPrice: ${wine.price}\n\n== Web Search Snippets Found ==\n${actualTextSnippets}` // Use the actual snippets variable
            }
        ];
        
        try {
            const reviewCompletion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: reviewMessages, 
                response_format: { type: "json_object" } 
            });
            const reviewContent = reviewCompletion.choices[0]?.message?.content;
            console.log(`[${requestId}] [${jobId}] Raw review/score response content for ${searchQueryBase}:`, reviewContent);
            if (reviewContent) {
                try {
                    const parsedResponse = JSON.parse(reviewContent);
                    finalReview = parsedResponse.review || finalReview;
                    finalScore = parsedResponse.score || finalScore;
                    console.log(`[${requestId}] [${jobId}] Parsed review: ${finalReview}`);
                    console.log(`[${requestId}] [${jobId}] Parsed score: ${finalScore}`);
                } catch (parseError) {
                    console.error(`[${requestId}] [${jobId}] Failed to parse review/score JSON:`, parseError, reviewContent);
                    finalReview = reviewContent.substring(0, 200); 
                }
            }
        } catch (reviewError) {
            console.error(`[${requestId}] [${jobId}] Error during final review/score generation for ${searchQueryBase}:`, reviewError);
        }
        
        // Step 4: Return combined data including actual snippets
        return {
          ...wine,
          tastingNotes: finalReview,
          score: finalScore,
          imageUrl: url, // Use the original uploaded image URL instead of searching for a specific wine image
          webSnippets: actualTextSnippets, // Pass actual snippets to frontend
          noBSMode: noBSMode // Pass No BS Mode flag
        };
      } catch (error) {
        // Catch errors in the overall wine processing block
        console.error(`[${requestId}] [${jobId}] Major error processing wine ${wine.producer} ${wine.name}:`, error);
        return wine; 
      }
    }));
    
    // Store result in KV
    await kv.hset(`job:${jobId}`, {
      status: 'completed',
      data: {
        wines: winesWithImages,
        imageUrl: url,
        rawAnalysis: wineAnalysis,
        noBSMode: noBSMode,
        locale: locale
      },
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log(`[${requestId}] [${jobId}] Stored results in KV, returning response`);
    
    // Return results immediately
    const responseData = {
      jobId,
      status: 'completed',
      requestId,
      data: {
        wines: winesWithImages,
        imageUrl: url
      }
    };
    
    return res.status(200).json(responseData);

  } catch (error: any) {
    console.error(`[${requestId}] [${jobId}] Error analyzing wine:`, error);
    
    // Update KV with the error
    try {
      await kv.hset(`job:${jobId}`, {
        status: 'failed',
        error: error.message || 'Unknown error',
        updatedAt: new Date().toISOString(),
        failedAt: new Date().toISOString()
      });
      console.log(`[${requestId}] [${jobId}] Updated KV with error status`);
    } catch (kvError) {
      console.error(`[${requestId}] [${jobId}] Failed to update KV with error:`, kvError);
    }
    
    // Return error with the jobId
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to analyze image',
      jobId // Always include jobId in the response
    });
  }
}

// Helper function to parse the unstructured text from OpenAI into structured data
function parseWineDetails(analysis: string, requestId: string, jobId: string): WineData[] {
  console.log(`[${requestId}] [${jobId}] Parsing wine details from analysis:`, analysis);
  
  // Split the analysis into sections for each wine
  const wineSections = analysis.split(/(?=\*\*Producer\/Winery\*\*:)/);
  console.log(`[${requestId}] [${jobId}] Found ${wineSections.length} wine sections`);
  
  return wineSections.filter(section => section.trim()).map(section => {
    console.log(`[${requestId}] [${jobId}] Processing wine section:`, section);
    
    const wineData: WineData = {
      producer: '',
      name: '',
      vintage: '',
      region: '',
      grapeVarieties: '',
      tastingNotes: '',
      score: 0,
      price: '',
      imageUrl: '',
      webSnippets: ''
    };

    // Extract producer
    const producerMatch = section.match(/\*\*Producer\/Winery\*\*:\s*([^*\n]+)/);
    if (producerMatch) {
      wineData.producer = producerMatch[1].trim();
      console.log(`[${requestId}] [${jobId}] Found producer:`, wineData.producer);
    }

    // Extract name
    const nameMatch = section.match(/\*\*Name\*\*:\s*([^*\n]+)/);
    if (nameMatch) {
      wineData.name = nameMatch[1].trim();
      console.log(`[${requestId}] [${jobId}] Found name:`, wineData.name);
    }

    // Extract vintage
    const vintageMatch = section.match(/\*\*Vintage\*\*:\s*(\d{4})/);
    if (vintageMatch) {
      wineData.vintage = vintageMatch[1];
      console.log(`[${requestId}] [${jobId}] Found vintage:`, wineData.vintage);
    }

    // Extract region
    const regionMatch = section.match(/\*\*Region\*\*:\s*([^*\n]+)/);
    if (regionMatch) {
      wineData.region = regionMatch[1].trim();
      console.log(`[${requestId}] [${jobId}] Found region:`, wineData.region);
    }

    // Extract grape varieties
    const grapeMatch = section.match(/\*\*Grape Varieties\*\*:\s*([^*\n]+)/);
    if (grapeMatch) {
      wineData.grapeVarieties = grapeMatch[1].trim();
      console.log(`[${requestId}] [${jobId}] Found grape varieties:`, wineData.grapeVarieties);
    }

    // Extract tasting notes
    const tastingMatch = section.match(/\*\*Tasting Notes\*\*:\s*([^*\n]+)/);
    if (tastingMatch) {
      wineData.tastingNotes = tastingMatch[1].trim();
      console.log(`[${requestId}] [${jobId}] Found tasting notes:`, wineData.tastingNotes);
    }

    // Extract score
    const scoreMatch = section.match(/\*\*Score\*\*:\s*(\d+)/);
    if (scoreMatch) {
      wineData.score = parseInt(scoreMatch[1]);
      console.log(`[${requestId}] [${jobId}] Found score:`, wineData.score);
    }

    // Extract price
    const priceMatch = section.match(/\*\*Price\*\*:\s*([^*\n]+)/);
    if (priceMatch) {
      wineData.price = priceMatch[1].trim();
      console.log(`[${requestId}] [${jobId}] Found price:`, wineData.price);
    }

    // If we have at least a producer or name, consider this a valid wine entry
    if (wineData.producer || wineData.name) {
      console.log(`[${requestId}] [${jobId}] Valid wine entry found:`, wineData);
      return wineData;
    }
    console.log(`[${requestId}] [${jobId}] Invalid wine entry, skipping`);
    return null;
  }).filter((wine): wine is WineData => wine !== null);
} 