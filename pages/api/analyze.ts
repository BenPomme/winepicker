import { NextApiRequest, NextApiResponse } from 'next';
import { Wine } from '../../utils/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the image data from the request body
    const { base64Image } = req.body;
    
    if (!base64Image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // The OpenAI API key will be stored as an environment variable in Vercel
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const serperApiKey = process.env.SERPER_API_KEY;
    
    if (!openaiApiKey || !serperApiKey) {
      return res.status(500).json({ error: 'API keys not configured' });
    }
    
    // Process the image with OpenAI Vision
    const wineData = await analyzeWineImage(base64Image, openaiApiKey, serperApiKey);
    
    // Return the wine data
    return res.status(200).json({ wines: wineData });
  } catch (error) {
    console.error('Error analyzing wine image:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to analyze wine image'
    });
  }
}

async function analyzeWineImage(base64Image: string, openaiApiKey: string, serperApiKey: string): Promise<Wine[]> {
  try {
    // Step 1: Analyze the image with OpenAI Vision API
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
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      })
    });

    const openaiData = await openaiResponse.json();
    
    // Parse the OpenAI response
    const wineInfo = JSON.parse(openaiData.choices[0].message.content);
    
    // If there's an error message, return an empty array
    if (wineInfo.error) {
      return [];
    }

    // Step 2: Search for wine ratings and reviews using Serper API
    const searchQuery = `${wineInfo.name} ${wineInfo.winery} ${wineInfo.year} wine rating review`;
    const serperResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: searchQuery,
        num: 5
      })
    });

    const serperData = await serperResponse.json();
    
    // Step 3: Generate a summary with OpenAI
    const summaryPrompt = `
      Wine information:
      ${JSON.stringify(wineInfo)}
      
      Search results:
      ${JSON.stringify(serperData)}
      
      Based on the information above, provide a detailed summary of this wine, including its characteristics, ratings, and any notable reviews. Format as JSON with fields: summary, score (out of 100 if available, otherwise estimate), additionalReviews (array of reviews).
    `;

    const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "user", content: summaryPrompt }
        ],
        max_tokens: 1000
      })
    });

    const summaryData = await summaryResponse.json();
    const wineAnalysis = JSON.parse(summaryData.choices[0].message.content);
    
    // Combine all data into a single wine object
    const wine: Wine = {
      name: wineInfo.name,
      winery: wineInfo.winery,
      year: wineInfo.year,
      region: wineInfo.region,
      grapeVariety: wineInfo.grapeVariety,
      type: wineInfo.type,
      imageUrl: "",
      uploadedImageUrl: `data:image/jpeg;base64,${base64Image}`,
      score: wineAnalysis.score || 0,
      summary: wineAnalysis.summary,
      aiSummary: wineAnalysis.summary,
      rating: {
        score: wineAnalysis.score || 0,
        source: "AI Analysis",
        review: wineAnalysis.summary
      },
      additionalReviews: wineAnalysis.additionalReviews || []
    };
    
    return [wine];
  } catch (error) {
    console.error('Error in wine analysis:', error);
    throw new Error('Failed to analyze wine image');
  }
} 