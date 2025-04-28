import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Initialize OpenAI with the API key from .env.local
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

// Simple in-memory store for testing
const jobStore = new Map();

// Simple response type
type AnalyzeResponse = {
  success: boolean;
  message?: string;
  jobId?: string;
  status?: string;
  data?: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyzeResponse>
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed'
    });
  }

  try {
    const { image, noBSMode } = req.body;
    console.log(`Received analyze request (No BS Mode: ${noBSMode ? 'ON' : 'OFF'})`);
    
    // Validate input
    if (!image) {
      return res.status(400).json({ 
        success: false, 
        message: 'Image is required'
      });
    }

    // Generate a job ID
    const jobId = uuidv4();
    console.log(`Generated Job ID: ${jobId}`);
    
    // Save image to public directory
    const buffer = Buffer.from(image.split(',')[1], 'base64');
    const imageFileName = `${jobId}.jpg`;
    const publicDir = path.join(process.cwd(), 'public');
    const uploadsDir = path.join(publicDir, 'uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const imagePath = path.join(uploadsDir, imageFileName);
    fs.writeFileSync(imagePath, buffer);
    console.log(`Image saved to ${imagePath}`);
    
    // Set the image URL with the hostname
    const baseUrl = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host || 'localhost:3000'}`;
    const imageUrl = `${baseUrl}/uploads/${imageFileName}`;
    console.log(`Image URL: ${imageUrl}`);
    
    // Create a job entry
    jobStore.set(jobId, {
      status: 'processing',
      createdAt: new Date().toISOString(),
      noBSMode: noBSMode,
      imageUrl: imageUrl
    });
    
    // Process the wine analysis in the background
    processWineAnalysis(jobId, imageUrl, noBSMode).catch(error => {
      console.error(`Background processing error:`, error);
      jobStore.set(jobId, {
        ...jobStore.get(jobId),
        status: 'failed',
        error: error.message,
        completedAt: new Date().toISOString()
      });
    });
    
    // Return the job ID immediately
    return res.status(202).json({
      success: true,
      jobId,
      status: 'processing',
      message: 'Analysis job started'
    });
  } catch (error: any) {
    console.error('Error processing analysis request:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process image'
    });
  }
}

// Create a handler for getting job status
export async function getJobStatus(jobId: string) {
  const job = jobStore.get(jobId);
  if (!job) {
    return { success: false, status: 'not_found', message: 'Job not found' };
  }
  return { success: true, ...job };
}

// Process wine image analysis
async function processWineAnalysis(jobId: string, imageUrl: string, noBSMode: boolean) {
  console.log(`[${jobId}] Starting wine analysis process...`);
  console.log(`[${jobId}] No BS Mode: ${noBSMode ? 'enabled' : 'disabled'}`);
  
  try {
    // Step 1: Analyze the image
    console.log(`[${jobId}] Analyzing image with OpenAI...`);
    const wines = await analyzeImageWithOpenAI(imageUrl);
    
    if (!wines || wines.length === 0) {
      console.log(`[${jobId}] No wines detected in the image`);
      jobStore.set(jobId, {
        ...jobStore.get(jobId),
        status: 'completed',
        result: { 
          wines: [],
          message: 'No wines detected in the image'
        },
        completedAt: new Date().toISOString()
      });
      return;
    }
    
    console.log(`[${jobId}] Detected ${wines.length} wines in the image`);
    
    // Step 2: Process each wine
    const processedWines = await Promise.all(wines.map(async (wine) => {
      console.log(`[${jobId}] Processing wine: ${wine.name}`);
      
      // Pass noBSMode to generateWineSummary
      const wineInfoWithMode = {
        ...wine,
        noBSMode
      };
      
      // Get wine summary and estimated score
      const { summary, score } = await generateWineSummary(wineInfoWithMode, noBSMode);
      
      return {
        ...wine,
        score,
        summary,
        imageUrl,
        noBSMode // Include the flag in the result
      };
    }));
    
    // Step 3: Store the results
    console.log(`[${jobId}] Storing results...`);
    const result = {
      status: 'completed',
      wines: processedWines,
      imageUrl,
      completedAt: new Date().toISOString()
    };
    
    jobStore.set(jobId, {
      ...jobStore.get(jobId),
      status: 'completed',
      result,
      completedAt: new Date().toISOString()
    });
    
    console.log(`[${jobId}] Analysis completed successfully`);
  } catch (error: any) {
    console.error(`[${jobId}] Error processing wine analysis:`, error);
    
    // Update store with error status
    jobStore.set(jobId, {
      ...jobStore.get(jobId),
      status: 'failed',
      error: error.message || 'Unknown error',
      failedAt: new Date().toISOString()
    });
  }
}

// Analyze image using URL with GPT-4o
async function analyzeImageWithOpenAI(imageUrl: string) {
  try {
    console.log("Calling OpenAI Vision API with URL:", imageUrl);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image and identify ALL wine bottles visible. For each wine, extract: name, vintage, producer, region, and varietal. Return a JSON array where each object represents a wine with these fields. If there are multiple wines, list all of them. Format: [{wine1}, {wine2}, ...]. Do not include markdown formatting or backticks."
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
    if (content.includes("```")) {
      content = content.replace(/```json\s*|\s*```/g, '');
    }
    content = content.trim();
    
    let parsedWines: any[] = [];
    try {
      if (content.startsWith('[')) {
        parsedWines = JSON.parse(content);
      } else if (content.startsWith('{')) {
        parsedWines = [JSON.parse(content)];
      } else {
        console.warn("OpenAI response is not valid JSON:", content);
        return []; 
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
    })).filter((wine: any) => wine.name);
  } catch (error) {
    console.error("Error calling OpenAI Vision API:", error);
    // If there's an error with image processing, return a mock wine
    return [{
      name: "Test Wine",
      vintage: "2020",
      producer: "Test Winery",
      region: "Test Region",
      varietal: "Test Varietal"
    }];
  }
}

// Generate AI-based wine summary and ratings
async function generateWineSummary(wineInfo: any, noBSMode: boolean = false): Promise<{ summary: string, score: number }> {
  try {
    const wineDescription = `${wineInfo.vintage || ''} ${wineInfo.producer || ''} ${wineInfo.name || ''} ${wineInfo.region || ''} ${wineInfo.varietal || ''}`.trim();
    
    let prompt;
    if (noBSMode) {
      prompt = `You are a brutally honest, no-bullshit sommelier who doesn't care about wine industry politics. Based only on what you know about: ${wineDescription}, provide:
1. A blunt, crude, and honest single-paragraph summary of this wine's characteristics. Be ruthless and direct, use casual and occasionally crude language. Do NOT use wine critic jargon or pretentious language.
2. An HONEST rating on a scale of 0-100, where bad wines can score as low as 0 and only truly exceptional wines score 90+.

Return your response in JSON format: {"summary": "your summary here", "score": numerical_score}

If there's insufficient information, be honest about that too - don't make up flowery descriptions.`;
    } else {
      prompt = `You are a wine expert. Based only on what you know about the following wine: ${wineDescription}, please provide:
1. A sophisticated yet concise single-paragraph summary of the likely characteristics, flavors, and quality of this wine.
2. An estimated rating on a scale of 0-100.

Return your response in JSON format: {"summary": "your summary here", "score": numerical_score}

If there's insufficient information to make a judgment, provide a general description based on the varietal, region, or producer reputation if known.`;
    }
    
    console.log(`Sending prompt to OpenAI for: ${wineDescription}`);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 350,
      temperature: noBSMode ? 0.9 : 0.7, // Higher temperature for No BS Mode
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0]?.message?.content || '{}';
    console.log(`Received response from OpenAI: ${content.substring(0, 100)}...`);
    
    const result = JSON.parse(content);
    
    // Get the score from OpenAI's response
    const score = result.score || (noBSMode ? 50 : 85);  // Only use defaults if OpenAI didn't return a score
    
    // No enforced minimum in standard mode - use exactly what OpenAI returns
    return { 
      summary: result.summary || "No summary available",
      score: score
    };
  } catch (error) {
    console.error('Error generating wine summary:', error);
    return { 
      summary: "Failed to generate summary",
      score: noBSMode ? 50 : 85
    };
  }
}