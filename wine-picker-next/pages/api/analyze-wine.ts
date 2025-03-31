import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { Wine, WineRating } from '@/types/wine';
import { OpenAI } from 'openai';

// Define response type
type ApiResponse = {
  success: boolean;
  message?: string;
  data?: {
    wines: Wine[];
  };
};

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

async function analyzeImageWithOpenAI(imageBase64: string, apiKey: string): Promise<any[]> {
  if (!imageBase64 || !apiKey) return [];
  const openai = new OpenAI({ apiKey: apiKey });
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Analyze this wine image and extract information for ALL wine bottles visible. Return a JSON array: [{\"name\": \"name\", \"winery\": \"winery\", \"year\": \"year\", \"type\": \"type\", \"region\": \"region\", \"grape_variety\": \"variety\"}]. Omit unknown fields."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.2
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error("OpenAI Vision response content is empty.");
      return [];
    }

    try {
      let parsedJson = JSON.parse(content);
      if (parsedJson && Array.isArray(parsedJson.wines)) {
        return parsedJson.wines;
      } else if (parsedJson && Array.isArray(parsedJson)) {
        return parsedJson;
      } else {
        console.error("Parsed JSON from OpenAI is not in the expected array format:", parsedJson);
        return [];
      }
    } catch (parseError) {
      console.error("Failed to parse JSON from OpenAI Vision response:", parseError, "Raw content:", content);
      let cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        return JSON.parse(cleanContent);
      } catch (finalParseError) {
        console.error("Failed to parse even after cleaning:", finalParseError);
        return [];
      }
    }
  } catch (error) {
    console.error('Error calling OpenAI Vision API:', error instanceof Error ? error.message : error);
    if (axios.isAxiosError(error)) {
      console.error('Axios Error Details:', error.response?.data);
      console.error('OpenAI API Response:', error.response?.data);
      console.error('OpenAI API Status:', error.response?.status);
      console.error('OpenAI API Headers:', error.response?.headers);
    }
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

function extractRatingFromReviews(reviews: string[]): { score: number, source: string, review?: string } {
    let highestScore = 0;
    let ratingSource = 'Reviews';
    let bestReview = reviews.length > 0 ? reviews[0] : undefined;

    const ratingPatterns = [
        /(?:rating|score):?\s*([\d.]+)\s*(?:out of|\/)\s*(100)/i,
        /(?:rating|score):?\s*([\d.]+)\s*(?:out of|\/)\s*(5)/i,
        /(\d{2,3})\s*(?:pt|pts|points)/i,
    ];

    reviews.forEach(review => {
        for (const pattern of ratingPatterns) {
            const match = review.match(pattern);
            if (match) {
                let score = parseFloat(match[1]);
                const scale = match[2] ? parseInt(match[2]) : (match[0].includes('pt') ? 100 : 0);

                if (scale === 5) {
                    score = score * 20;
                } else if (scale === 0 && score <= 5) {
                    score = score * 20;
                }
                 score = Math.max(0, Math.min(100, score));

                if (score > highestScore) {
                    highestScore = score;
                    bestReview = review;
                    if (review.toLowerCase().includes('wine spectator')) ratingSource = 'Wine Spectator';
                    else if (review.toLowerCase().includes('vivino')) ratingSource = 'Vivino';
                    else if (review.toLowerCase().includes('cellartracker')) ratingSource = 'CellarTracker';
                }
                break;
            }
        }
    });

    return { score: Math.round(highestScore), source: ratingSource, review: bestReview };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { imageBase64 } = req.body;
  const openAIApiKey = process.env.OPENAI_API_KEY;
  const serperApiKey = process.env.SERPER_API_KEY;

  if (!imageBase64) {
    return res.status(400).json({ success: false, message: 'No image provided' });
  }
  if (!openAIApiKey || !serperApiKey) {
    console.error('API keys missing!');
    return res.status(500).json({ success: false, message: 'Server configuration error: API keys missing.' });
  }
   console.log('API Keys available (masked):', {
      openAI: openAIApiKey ? `sk-...${openAIApiKey.slice(-4)}` : 'Missing',
      serper: serperApiKey ? `...${serperApiKey.slice(-4)}` : 'Missing'
    });

  try {
    console.log('Step 1: Analyzing image with OpenAI Vision...');
    const identifiedWines = await analyzeImageWithOpenAI(imageBase64, openAIApiKey);
    if (!identifiedWines || identifiedWines.length === 0) {
        console.log('No wines identified by OpenAI Vision.');
        return res.status(404).json({ success: false, message: 'Could not identify any wines in the image.' });
    }
     console.log(`Identified ${identifiedWines.length} potential wine(s).`);

    const primaryWineInfo = identifiedWines[0];
    const wineName = primaryWineInfo.name;
     if (!wineName) {
         console.log('Primary identified wine has no name.');
         return res.status(400).json({ success: false, message: 'Identified wine data is incomplete (missing name).' });
     }
     console.log(`Processing primary wine: ${wineName}`);

    console.log('Step 2: Fetching reviews from Serper...');
    const reviews = await getWineReviews(
      wineName,
      primaryWineInfo.winery || '',
      primaryWineInfo.year || '',
      serperApiKey
    );
     console.log(`Fetched ${reviews.length} review snippets.`);

    console.log('Step 3: Extracting rating from reviews...');
    const ratingInfo = extractRatingFromReviews(reviews);
     console.log(`Extracted Rating: ${ratingInfo.score}% from ${ratingInfo.source}`);

    console.log('Step 4: Generating AI Summary...');
    const aiSummary = await generateAISummary(reviews, openAIApiKey);
     console.log(`Generated AI Summary: ${aiSummary || 'None'}`);

    console.log('Step 5: Fetching wine image...');
    const imageUrl = await fetchWineImage(wineName, serperApiKey);
     console.log(`Fetched Image URL: ${imageUrl || 'None'}`);

    const finalWine: Wine = {
      name: wineName,
      winery: primaryWineInfo.winery || undefined,
      year: primaryWineInfo.year || undefined,
      region: primaryWineInfo.region || undefined,
      grapeVariety: primaryWineInfo.grape_variety || primaryWineInfo.grapeVariety || undefined,
      type: primaryWineInfo.type || undefined,
      imageUrl: imageUrl || undefined,
      rating: {
        score: ratingInfo.score,
        source: ratingInfo.source,
        review: ratingInfo.review,
        isPriceValue: false,
      },
      additionalReviews: reviews.filter(r => r !== ratingInfo.review),
      aiSummary: aiSummary,
      rawText: primaryWineInfo.raw_text || primaryWineInfo.rawText || undefined,
      pairingScores: {
          'meat': 7.0, 'fish': 7.0, 'sweet': 5.0, 'dry': 5.0,
          'fruity': 5.0, 'light': 5.0, 'full-bodied': 5.0,
       }
    };

    console.log('Analysis complete. Sending response.');
    return res.status(200).json({
      success: true,
      data: {
         wines: [finalWine]
      }
    });

  } catch (error) {
    console.error('Unhandled error in API handler:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred during analysis.'
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