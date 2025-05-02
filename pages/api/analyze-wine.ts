import type { NextApiRequest, NextApiResponse } from 'next';
import { put } from '@vercel/blob';
import { kv } from '@vercel/kv';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define interface types
interface WineInfoInput {
  name?: string;
  vintage?: string;
  producer?: string;
  region?: string;
  varietal?: string;
}

interface WineRating {
  score: number;
  source: string;
  review?: string;
}

interface AnalyzeRequestBody {
  image: string;
  locale?: string; // Add locale parameter
}

interface AnalyzeResponseData {
  jobId: string;
  status: string;
  requestId?: string;
  message?: string;
}

// Simple validation for base64 image
function validateBase64Image(base64String: string): boolean {
  if (!base64String || typeof base64String !== 'string') return false;
  // Basic regex check
  if (!/^data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+$/.test(base64String)) {
    // Also allow raw base64 string if frontend sends that
    if (!/^[A-Za-z0-9+/=]+$/.test(base64String)) {
      return false;
    }
  }
  // Check size (crude estimate, limit ~10MB)
  if (base64String.length > 10 * 1024 * 1024 * 4/3) { 
    return false;
  }
  return true;
}

// Analyze image using URL with GPT-4o
async function analyzeImageWithOpenAI(imageUrl: string, locale: string = 'en'): Promise<WineInfoInput[]> {
  try {
    console.log("Calling OpenAI Vision API with URL:", imageUrl);
    // Keep image analysis in English regardless of locale
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image and identify ALL wine bottles visible. For each wine, extract: name, vintage, producer, region, and varietal. Return a JSON array where each object represents a wine with these fields. If there are multiple wines, list all of them. Format: [{wine1}, {wine2}, ...]. Do not include markdown formatting or backticks.`
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
      max_tokens: 500
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
    return parsedWines.map((wine: any) => ({
      name: wine.name || wine.wine_name || '',
      vintage: wine.vintage || wine.year || '',
      producer: wine.producer || wine.winery || '',
      region: wine.region || '',
      varietal: wine.varietal || wine.grape_variety || ''
    })).filter(wine => wine.name); // Ensure at least a name was found
  } catch (error) {
    console.error("Error calling OpenAI Vision API:", error);
    return [];
  }
}

// Generate AI-based wine summary and ratings
async function generateWineSummary(wineInfo: WineInfoInput, locale: string = 'en'): Promise<{ summary: string, score: number }> {
  try {
    const wineDescription = `${wineInfo.vintage || ''} ${wineInfo.producer || ''} ${wineInfo.name || ''} ${wineInfo.region || ''} ${wineInfo.varietal || ''}`.trim();
    
    // Use localized prompts for each language
    let prompt = '';
    
    if (locale === 'fr') {
      prompt = `Vous êtes un expert en vin. En vous basant uniquement sur ce que vous savez du vin suivant: ${wineDescription}, veuillez fournir:
1. Un résumé sophistiqué mais concis en un seul paragraphe des caractéristiques probables, des saveurs et de la qualité de ce vin.
2. Une note estimée sur une échelle de 0 à 100.

Retournez votre réponse au format JSON: {"summary": "votre résumé ici", "score": note_numérique}

S'il y a des informations insuffisantes pour porter un jugement, fournissez une description générale basée sur le cépage, la région ou la réputation du producteur si connu.`;
    } else if (locale === 'zh') {
      prompt = `您是一位葡萄酒专家。仅基于您对以下葡萄酒的了解：${wineDescription}，请提供：
1. 一段简洁而精致的单段落总结，描述这款葡萄酒可能的特点、风味和品质。
2. 一个0-100分制的估计评分。

以JSON格式返回您的回答：{"summary": "您的总结", "score": 数字评分}

如果没有足够的信息做出判断，请根据葡萄品种、产区或生产商声誉（如已知）提供一个一般性描述。`;
    } else if (locale === 'ar') {
      prompt = `أنت خبير نبيذ. بناءً فقط على ما تعرفه عن النبيذ التالي: ${wineDescription}، يرجى تقديم:
1. ملخص متطور ولكن موجز من فقرة واحدة للخصائص المحتملة والنكهات وجودة هذا النبيذ.
2. تقدير درجة على مقياس من 0 إلى 100.

أعد إجابتك بتنسيق JSON: {"summary": "ملخصك هنا", "score": الدرجة_الرقمية}

إذا كانت هناك معلومات غير كافية لإصدار حكم، قدم وصفًا عامًا بناءً على التنوع أو المنطقة أو سمعة المنتج إذا كانت معروفة.`;
    } else {
      // Default English prompt
      prompt = `You are a wine expert. Based only on what you know about the following wine: ${wineDescription}, please provide:
1. A sophisticated yet concise single-paragraph summary of the likely characteristics, flavors, and quality of this wine.
2. An estimated rating on a scale of 0-100.

Return your response in JSON format: {"summary": "your summary here", "score": numerical_score}

If there's insufficient information to make a judgment, provide a general description based on the varietal, region, or producer reputation if known.`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 350,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content || '{}';
    const result = JSON.parse(content);
    return { 
      summary: result.summary || "No summary available",
      score: result.score || 85
    };
  } catch (error) {
    console.error('Error generating wine summary:', error);
    return { summary: "Failed to generate summary", score: 85 };
  }
}

// Process wine image analysis and update results in KV store
async function processWineAnalysis(jobId: string, imageUrl: string, requestId: string, locale: string = 'en') {
  console.log(`[${requestId}] [${jobId}] Starting wine analysis process...`);
  try {
    // Update status to processing
    await kv.hset(`job:${jobId}`, {
      status: 'processing',
      updatedAt: new Date().toISOString()
    });

    // Step 1: Analyze the image
    console.log(`[${requestId}] [${jobId}] Analyzing image with OpenAI in locale: ${locale}...`);
    const wines = await analyzeImageWithOpenAI(imageUrl, locale);
    
    if (!wines || wines.length === 0) {
      console.log(`[${requestId}] [${jobId}] No wines detected in the image`);
      await kv.hset(`job:${jobId}`, {
        status: 'completed',
        result: { 
          wines: [],
          message: 'No wines detected in the image'
        },
        updatedAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      });
      return;
    }

    console.log(`[${requestId}] [${jobId}] Detected ${wines.length} wines in the image`);
    
    // Step 2: Process each wine sequentially to avoid overwhelming the model
    const processedWines = [];
    
    for (const wine of wines) {
      console.log(`[${requestId}] [${jobId}] Processing wine: ${wine.name}`);
      
      try {
        // Get wine summary and estimated score
        const { summary, score } = await generateWineSummary(wine, locale);
        
        processedWines.push({
          ...wine,
          score,
          summary,
          imageUrl
        });
        
        // Update the KV store with progress after each wine is processed
        // This helps make the progress more visible and accurate
        const progressResult = {
          status: 'processing',
          wines: processedWines,
          partialResult: true,
          processedCount: processedWines.length,
          totalCount: wines.length,
          imageUrl
        };
        
        await kv.hset(`job:${jobId}`, {
          status: 'processing',
          partialResult: progressResult,
          updatedAt: new Date().toISOString()
        });
        
      } catch (wineError) {
        console.error(`[${requestId}] [${jobId}] Error processing wine ${wine.name}:`, wineError);
        // Still add the wine with error information
        processedWines.push({
          ...wine,
          score: 80, // Default score
          summary: "Error generating details for this wine.",
          imageUrl,
          processingError: wineError.message
        });
      }
    }

    // Step 3: Store the results
    console.log(`[${requestId}] [${jobId}] Storing results in KV...`);
    const result = {
      status: 'completed',
      wines: processedWines,
      imageUrl,
      completedAt: new Date().toISOString()
    };

    await kv.hset(`job:${jobId}`, {
      status: 'completed',
      result,
      updatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    });

    console.log(`[${requestId}] [${jobId}] Analysis completed successfully`);
  } catch (error: any) {
    console.error(`[${requestId}] [${jobId}] Error processing wine analysis:`, error);
    
    // Update KV with error status
    await kv.hset(`job:${jobId}`, {
      status: 'failed',
      error: error.message || 'Unknown error',
      updatedAt: new Date().toISOString(),
      failedAt: new Date().toISOString()
    });
  }
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
  console.log(`[${requestId}] Analyze request received`);

  try {
    const { image, locale = 'en' } = req.body as AnalyzeRequestBody;
    console.log(`[${requestId}] Processing in locale: ${locale}`);

    if (!image) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'No image provided',
        jobId: '' 
      });
    }

    // Generate a unique job ID
    const jobId = uuidv4();
    console.log(`[${requestId}] Generated Job ID: ${jobId}`);

    // Set the job ID in the response headers immediately for client availability
    res.setHeader('x-job-id', jobId);

    // Create initial job status in KV store
    console.log(`[${requestId}] [${jobId}] Initial status set to 'uploading' in KV`);
    await kv.hset(`job:${jobId}`, {
      status: 'uploading',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requestId
    });

    // Upload image to Blob storage
    console.log(`[${requestId}] [${jobId}] Uploading image to Vercel Blob...`);
    const imageData = image.includes(',') ? image.split(',')[1] : image; // Handle both data URL and raw base64
    const buffer = Buffer.from(imageData, 'base64');
    
    // Upload the image to Vercel Blob storage
    const { url } = await put(`${jobId}.jpg`, buffer, {
      access: 'public',
    });
    
    console.log(`[${requestId}] [${jobId}] Image uploaded to Vercel Blob: ${url}`);

    // Update KV store with processing status
    await kv.hset(`job:${jobId}`, {
      status: 'processing',
      imageUrl: url,
      locale, // Store the locale with the job
      updatedAt: new Date().toISOString(),
      processingStartedAt: new Date().toISOString()
    });

    // Start the analysis process in the background
    // Note: This is an important change from the previous approach
    // Instead of calling Netlify, we process directly in this function but don't await the result
    processWineAnalysis(jobId, url, requestId, locale).catch(error => {
      console.error(`[${requestId}] [${jobId}] Background processing error:`, error);
    });

    // Return a success response immediately
    return res.status(202).json({
      jobId,
      status: 'processing',
      requestId,
      message: 'Analysis job started'
    });

  } catch (error: any) {
    console.error(`[${requestId}] Error processing analysis request:`, error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to process image',
      jobId: ''
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Increased limit for base64 images
    },
    responseLimit: false,
  },
}; 