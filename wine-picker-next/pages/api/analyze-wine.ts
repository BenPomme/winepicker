import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { Wine, WineRating } from '@/types/wine';
import { OpenAI } from 'openai';
import { Configuration } from 'openai';
import { v4 as uuidv4 } from 'uuid';

// Define response type
type ApiResponse = {
  success: boolean;
  message?: string;
  data?: {
    wines: Wine[];
  };
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 5; // Max 5 requests per minute

// Simple in-memory storage for rate limiting
// In production, use Redis or similar for distributed rate limiting
const rateLimitStore: Record<string, { count: number, resetTime: number }> = {};

// Clean up expired rate limit records periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach(ip => {
    if (rateLimitStore[ip].resetTime < now) {
      delete rateLimitStore[ip];
    }
  });
}, 5 * 60 * 1000); // Clean up every 5 minutes

async function fetchWineImage(wineName: string, serperApiKey: string): Promise<string | null> {
  if (!wineName || !serperApiKey) return null;
  try {
    const response = await axios.get('https://google.serper.dev/images', {
      headers: { 'X-API-KEY': serperApiKey, 'Content-Type': 'application/json' },
      params: { q: `${wineName} wine bottle`, gl: 'us' }
    });
    if (response.data.images && response.data.images.length > 0) {
      const image = response.data.images.find((img: any) => !img.imageUrl.includes('thumb'));
      return image ? image.imageUrl : response.data.images[0].imageUrl;
    }
    return null;
  } catch (error) {
    console.error('Error fetching wine image from Serper:', error instanceof Error ? error.message : error);
    return null;
  }
}

async function generateAISummary(reviews: string[], openAIApiKey: string): Promise<string> {
  if (!reviews || reviews.length === 0 || !openAIApiKey) return '';
  const openai = new OpenAI({ apiKey: openAIApiKey });
  const prompt = `Analyze these wine reviews and provide a single, elegant sentence summarizing the overall sentiment and key characteristics. Be honest and balanced, reflecting both positive and negative points if present:

${reviews.join('\\n---\\n')}

Respond with only the summary sentence.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a sophisticated wine connoisseur who summarizes reviews concisely and elegantly, capturing the essence honestly." },
        { role: "user", content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 100
    });
    return response.choices[0].message.content?.trim() || '';
  } catch (error) {
     console.error('Error generating AI Summary with OpenAI:', error instanceof Error ? error.message : error);
     return '';
  }
}

async function analyzeImageWithOpenAI(image: string) {
  try {
    console.log("Calling OpenAI Vision API...");
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
                url: `data:image/jpeg;base64,${image}`
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    // Get the raw content from the response
    let content = response.choices[0].message.content || '[]';
    console.log("Raw API response:", content);
    
    // Clean the content by removing markdown code blocks if present
    if (content.includes("```")) {
      content = content.replace(/```json\s*|\s*```/g, '');
    }
    
    // Try to parse the JSON
    let parsedWines = [];
    try {
      // Check if the response is already an array
      if (content.trim().startsWith('[')) {
        parsedWines = JSON.parse(content);
      } else {
        // If it's a single object, wrap it in an array
        parsedWines = [JSON.parse(content)];
      }
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      
      // Fallback: try to extract JSON objects using regex
      const jsonPattern = /{[^{}]*({[^{}]*})*[^{}]*}/g;
      const matches = content.match(jsonPattern);
      
      if (matches && matches.length > 0) {
        for (const match of matches) {
          try {
            parsedWines.push(JSON.parse(match));
          } catch (e) {
            console.warn("Couldn't parse potential JSON object:", match);
          }
        }
      }
      
      // If still no wines found, try another approach for finding wine information
      if (parsedWines.length === 0) {
        console.warn("Using fallback extraction method...");
        
        // Simple extraction of key-value pairs
        const nameMatch = content.match(/name["']?:\s*["']([^"']+)["']/i);
        const vintageMatch = content.match(/vintage["']?:\s*["']([^"']+)["']/i);
        const producerMatch = content.match(/producer["']?:\s*["']([^"']+)["']/i);
        const regionMatch = content.match(/region["']?:\s*["']([^"']+)["']/i);
        const varietalMatch = content.match(/varietal["']?:\s*["']([^"']+)["']/i);
        
        if (nameMatch) {
          parsedWines.push({
            name: nameMatch[1],
            vintage: vintageMatch ? vintageMatch[1] : '',
            producer: producerMatch ? producerMatch[1] : '',
            region: regionMatch ? regionMatch[1] : '',
            varietal: varietalMatch ? varietalMatch[1] : ''
          });
        }
      }
    }
    
    console.log(`Identified ${parsedWines.length} wine(s)`, parsedWines);
    
    // Normalize the data
    return parsedWines.map(wine => ({
      wineName: wine.name || wine.wine_name || '',
      vintage: wine.vintage || wine.year || '',
      producer: wine.producer || wine.winery || '',
      region: wine.region || '',
      varietal: wine.varietal || wine.grape_variety || ''
    }));
  } catch (error) {
    console.error("Error calling OpenAI Vision API:", error);
    return [];
  }
}

async function getWineReviews(wineName: string, winery: string, year: string, apiKey: string): Promise<string[]> {
   if (!wineName || !apiKey) return [];
   const query = `${year || ''} ${winery || ''} ${wineName} reviews OR tasting notes OR opinions`.trim().replace(/\s+/g, ' ');
   try {
       const response = await axios.post('https://google.serper.dev/search',
         { q: query, gl: 'us', num: 5 },
         { headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' } }
       );

       if (response.data.organic && response.data.organic.length > 0) {
           return response.data.organic.map((item: any) => item.snippet || '').filter(Boolean);
       }
       return [];
   } catch (error) {
       console.error('Error fetching wine reviews from Serper:', error instanceof Error ? error.message : error);
       return [];
   }
}

async function extractRatingFromReviews(reviews: string[]): Promise<{ score: number, source: string, review?: string }> {
  // If no reviews, return default 0 rating
  if (!reviews || reviews.length === 0) {
    return { score: 0, source: 'No reviews available' };
  }

  // Look for numbers followed by /100, /5, pts, or percentage
  const ratingPatterns = [
    /(\d{1,3})\s*\/\s*100/i,
    /(\d{1,2})\s*\/\s*5/i,
    /(\d{1,3})\s*pts/i,
    /(\d{1,3})\s*points/i,
    /(\d{1,3})\s*%/i,
    /(\d{1,2})\s*stars/i,
    /rated\s*(\d{1,3})/i
  ];

  let highestScore = 0;
  let ratingSource = '';
  let bestReview = '';

  // Process each review looking for ratings
  reviews.forEach(review => {
    if (!review) return;
    
    let reviewText = typeof review === 'string' ? review : review.snippet || review.text || '';
    let reviewSource = typeof review === 'string' ? 'Review' : review.source || 'Review';
    
    // Try each pattern to find ratings
    for (const pattern of ratingPatterns) {
      const match = reviewText.match(pattern);
      if (match) {
        let score = parseInt(match[1]);
        
        // Convert to 100-point scale
        if (pattern.toString().includes('/5')) {
          score = Math.round((score / 5) * 100);
        } else if (pattern.toString().includes('stars')) {
          score = Math.round((score / 5) * 100);
        }
        
        // Cap at 100
        score = Math.min(score, 100);
        
        // Update if this is the highest score
        if (score > highestScore) {
          highestScore = score;
          ratingSource = reviewSource;
          bestReview = reviewText;
        }
      }
    }
  });

  // If no ratings found in reviews, estimate a score based on sentiment
  if (highestScore === 0 && reviews.length > 0) {
    // Use OpenAI to analyze the sentiment of the reviews
    return await estimateScoreFromReviews(reviews);
  }

  return { score: highestScore, source: ratingSource, review: bestReview };
}

async function estimateScoreFromReviews(reviews: string[]): Promise<{ score: number, source: string, review?: string }> {
  if (!reviews || reviews.length === 0) {
    return {
      score: 75,
      source: 'AI Estimated (Default)',
      review: 'No reviews available for analysis'
    };
  }

  const combinedReviews = reviews.join('\n\n').substring(0, 1500);
  const prompt = `Analyze these wine reviews and estimate a score from 0-100 based on the sentiment and wine descriptors:

${combinedReviews}

Respond with a JSON object in this format:
{
- score: A number from 0-100 representing the quality of the wine based on the reviews
- explanation: A brief explanation of why you assigned this score
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.2
    });

    const content = response.choices[0]?.message?.content || '';
    
    // Clean up the content to remove markdown formatting if present
    let cleanedContent = content;
    
    // Remove markdown code block markers if present
    if (content.includes("```json")) {
      cleanedContent = content.replace(/```json\n|\n```/g, "");
    } else if (content.includes("```")) {
      cleanedContent = content.replace(/```\n|\n```/g, "");
    }
    
    // Try to extract JSON using regex if it's still not valid
    if (!cleanedContent.trim().startsWith('{')) {
      const jsonMatch = cleanedContent.match(/{[\s\S]*}/);
      if (jsonMatch) {
        cleanedContent = jsonMatch[0];
      }
    }
    
    const result = JSON.parse(cleanedContent);

    return {
      score: result.score || 75,
      source: 'AI Estimated',
      review: result.explanation || combinedReviews.substring(0, 100) + '...'
    };
  } catch (error) {
    console.error('Error estimating score from reviews:', error);
    // Fallback to a reasonable score if AI estimation fails
    return {
      score: 75,
      source: 'AI Estimated (Fallback)',
      review: combinedReviews.substring(0, 100) + '...'
    };
  }
}

async function generateAIScoreAndSummary(reviews: Array<{ rating: number; text: string }>) {
  const prompt = `Based on the following wine reviews, generate a score from 0-100 and a concise summary. Consider the ratings and overall sentiment from the reviews:

${reviews.map(review => `Rating: ${review.rating}/100\nReview: ${review.text}`).join('\n\n')}

Provide the response in JSON format with "score" and "summary" fields. The score should be a number between 0-100, and the summary should be 2-3 sentences highlighting the key points.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 300
  });

  const content = response.choices[0].message.content || '{}';
  
  // Clean up the content to remove markdown formatting if present
  let cleanedContent = content;
  
  // Remove markdown code block markers if present
  if (content.includes("```json")) {
    cleanedContent = content.replace(/```json\n|\n```/g, "");
  } else if (content.includes("```")) {
    cleanedContent = content.replace(/```\n|\n```/g, "");
  }
  
  // Try to extract JSON using regex if it's still not valid
  if (!cleanedContent.trim().startsWith('{')) {
    const jsonMatch = cleanedContent.match(/{[\s\S]*}/);
    if (jsonMatch) {
      cleanedContent = jsonMatch[0];
    }
  }
  
  try {
    const result = JSON.parse(cleanedContent);
    return {
      score: result.score || 0,
      summary: result.summary || ''
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return {
      score: 75,
      summary: content.substring(0, 200) // Return part of the raw content as fallback
    };
  }
}

// Validate the base64 image
function validateBase64Image(base64String: string): boolean {
  // Check if it's a valid base64 string
  if (!/^[A-Za-z0-9+/=]+$/.test(base64String)) {
    return false;
  }
  
  // Check size (limit to ~5MB)
  if (base64String.length > 7 * 1024 * 1024) {
    return false;
  }
  
  return true;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Generate a request ID for tracking
  const requestId = uuidv4();
  console.log(`[${requestId}] Request received`);
  
  // Check if method is allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed',
      requestId
    });
  }

  // Apply rate limiting
  const clientIp = req.headers['x-forwarded-for'] as string || 'unknown';
  const now = Date.now();
  
  if (!rateLimitStore[clientIp]) {
    rateLimitStore[clientIp] = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW
    };
  }
  
  const clientLimitData = rateLimitStore[clientIp];
  
  // Reset counter if window has passed
  if (clientLimitData.resetTime < now) {
    clientLimitData.count = 0;
    clientLimitData.resetTime = now + RATE_LIMIT_WINDOW;
  }
  
  // Increment counter and check limit
  clientLimitData.count++;
  
  if (clientLimitData.count > MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({ 
      success: false, 
      message: 'Too many requests, please try again later',
      requestId
    });
  }
  
  // Set headers for rate limit info
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
  res.setHeader('X-RateLimit-Remaining', (MAX_REQUESTS_PER_WINDOW - clientLimitData.count).toString());
  res.setHeader('X-RateLimit-Reset', Math.ceil(clientLimitData.resetTime / 1000).toString());
  res.setHeader('X-Request-ID', requestId);

  // Get and validate input
  const { image } = req.body;
  const serperApiKey = process.env.SERPER_API_KEY;

  if (!image) {
    return res.status(400).json({ 
      success: false, 
      message: 'No image provided',
      requestId
    });
  }
  
  if (!validateBase64Image(image)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid image format or size',
      requestId
    });
  }
  
  if (!serperApiKey) {
    console.error(`[${requestId}] API keys missing!`);
    return res.status(500).json({ 
      success: false, 
      message: 'Server configuration error: API keys missing.',
      requestId
    });
  }
  
  console.log(`[${requestId}] API Keys available (masked):`, {
    serper: serperApiKey ? `...${serperApiKey.slice(-4)}` : 'Missing'
  });

  try {
    console.log(`[${requestId}] Step 1: Analyzing image with OpenAI Vision...`);
    const identifiedWines = await analyzeImageWithOpenAI(image);
    if (identifiedWines.length === 0) {
      console.log(`[${requestId}] No wine identified by OpenAI Vision.`);
      return res.status(404).json({ 
        success: false, 
        message: 'Could not identify any wine in the image.',
        requestId
      });
    }
    console.log(`[${requestId}] Identified ${identifiedWines.length} wine(s)`);

    // Process each wine in parallel with a timeout
    const processWineWithTimeout = async (wineInfo: any, timeoutMs = 25000) => {
      const timeoutPromise = new Promise<any>((_, reject) => {
        setTimeout(() => reject(new Error('Processing timed out')), timeoutMs);
      });
      
      const processPromise = (async () => {
        try {
          // Fetch reviews
          console.log(`[${requestId}] Processing wine: ${wineInfo.wineName}`);
          const reviews = await getWineReviews(
            wineInfo.wineName,
            wineInfo.producer || '',
            wineInfo.vintage || '',
            serperApiKey
          );
          console.log(`[${requestId}] Fetched ${reviews.length} review snippets for ${wineInfo.wineName}.`);

          // Extract rating
          const ratingInfo = await extractRatingFromReviews(reviews);
          console.log(`[${requestId}] Extracted Rating: ${ratingInfo.score}% for ${wineInfo.wineName}`);

          // Generate AI summary
          const aiSummary = await generateAISummary(reviews, process.env.OPENAI_API_KEY || '');
          console.log(`[${requestId}] Generated AI Summary for ${wineInfo.wineName}: ${aiSummary || 'None'}`);

          // Fetch wine image
          const imageUrl = await fetchWineImage(wineInfo.wineName, serperApiKey);
          console.log(`[${requestId}] Fetched Image URL for ${wineInfo.wineName}: ${imageUrl || 'None'}`);

          // Return comprehensive wine data
          return {
            name: wineInfo.wineName,
            vintage: wineInfo.vintage || undefined,
            producer: wineInfo.producer || undefined,
            region: wineInfo.region || undefined,
            varietal: wineInfo.varietal || undefined,
            imageUrl: imageUrl || undefined,
            score: ratingInfo.score,
            ratingSource: ratingInfo.source,
            summary: aiSummary || '',
            additionalReviews: reviews.map(r => {
              const reviewScore = typeof r === 'string' 
                ? extractRatingFromReviews([r]).score || 0
                : r.rating || 0;
                
              return {
                source: typeof r === 'string' ? 'Review' : r.source || 'Review',
                rating: reviewScore,
                review: typeof r === 'string' ? r : r.snippet || r.text || ''
              };
            })
          };
        } catch (error) {
          console.error(`[${requestId}] Error processing wine ${wineInfo.wineName}:`, error);
          // Return partial data if there's an error
          return {
            name: wineInfo.wineName,
            vintage: wineInfo.vintage || undefined,
            producer: wineInfo.producer || undefined,
            region: wineInfo.region || undefined,
            varietal: wineInfo.varietal || undefined,
            error: 'Failed to process complete wine data'
          };
        }
      })();
      
      return Promise.race([processPromise, timeoutPromise]).catch(error => {
        console.error(`[${requestId}] Wine processing timed out for ${wineInfo.wineName}:`, error);
        return {
          name: wineInfo.wineName,
          vintage: wineInfo.vintage || undefined,
          producer: wineInfo.producer || undefined,
          region: wineInfo.region || undefined,
          varietal: wineInfo.varietal || undefined,
          error: 'Processing timed out'
        };
      });
    };
    
    const processedWines = await Promise.all(
      identifiedWines.map(wineInfo => processWineWithTimeout(wineInfo))
    );

    console.log(`[${requestId}] Analysis complete. Sending response.`);
    return res.status(200).json({ 
      success: true, 
      wines: processedWines,
      message: `Successfully analyzed ${processedWines.length} wine(s)`,
      requestId
    });
  } catch (error) {
    console.error(`[${requestId}] Error analyzing wine:`, error);
    return res.status(500).json({ 
      success: false, 
      message: 'An internal server error occurred during analysis.',
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}; 