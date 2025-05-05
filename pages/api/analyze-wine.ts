import type { NextApiRequest, NextApiResponse } from 'next';

// Define types for API
interface WineRating {
  score: number;
  source: string;
  review: string;
}

interface Wine {
  name: string;
  winery: string;
  year: string;
  region: string;
  grapeVariety: string;
  type: string;
  imageUrl: string;
  uploadedImageUrl: string;
  score: number;
  summary: string;
  aiSummary: string;
  rating: WineRating;
  additionalReviews: Array<{ review: string }>;
}

interface ApiRequest {
  method?: string;
  body: {
    image?: string;
  };
}

interface ApiResponse {
  status(code: number): ApiResponse;
  json(data: any): void;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface WineData {
  name: string;
  winery: string;
  year: string;
  region: string;
  grapeVariety: string;
  type: string;
  error?: string;
  additionalReviews: string[];
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Get the image data from the request
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ success: false, message: 'No image provided' });
    }
    
    // Get API keys from environment variables
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      console.error('API keys missing!');
      return res.status(500).json({ 
        success: false, 
        message: 'Server configuration error: API keys missing.'
      });
    }

    // Call OpenAI to analyze the wine image
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "You are a wine expert. Identify the wine in this image. Include as much detail as possible about the wine: full name, winery, year, region, grape varieties, type (red, white, rosé, etc.). ONLY return the details in JSON format with fields: name, winery, year, region, grapeVariety, type. If no wine is visible or identifiable, return an error message in the JSON."
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
      })
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
    }

    const openaiData: OpenAIResponse = await openaiResponse.json();
    
    // Parse OpenAI's response
    let wineData: WineData;
    try {
      const content = openaiData.choices[0].message.content;
      wineData = JSON.parse(content);
      
      // Check if there's an error message
      if (wineData.error) {
        return res.status(404).json({
          success: false,
          message: typeof wineData.error === 'string' ? wineData.error : 'Could not identify wine in the image'
        });
      }
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to parse wine data from image'
      });
    }

    // Format wine data
    const wine: Wine = {
      name: wineData.name || 'Unknown Wine',
      winery: wineData.winery || '',
      year: wineData.year || '',
      region: wineData.region || '',
      grapeVariety: wineData.grapeVariety || '',
      type: wineData.type || '',
      imageUrl: '',
      uploadedImageUrl: `data:image/jpeg;base64,${image.substring(0, 100)}...`,
      score: 90,
      summary: `${wineData.name} is a ${wineData.type || ''} wine from ${wineData.winery || ''} in ${wineData.region || ''}.`,
      aiSummary: `${wineData.name} is a ${wineData.type || ''} wine from ${wineData.winery || ''} in ${wineData.region || ''}.`,
      rating: {
        score: 90,
        source: "AI Analysis",
        review: `${wineData.name} is a ${wineData.type || ''} wine from ${wineData.winery || ''} in ${wineData.region || ''}.`
      },
      additionalReviews: wineData.additionalReviews ? wineData.additionalReviews.map(review => ({
        review: String(review)
      })) : []
    };
    
    // Return success response with wine data
    return res.status(200).json({ 
      success: true,
      wines: [wine]
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'An unknown error occurred' 
    });
  }
} 