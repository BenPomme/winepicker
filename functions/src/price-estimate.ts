import * as functions from 'firebase-functions';
import OpenAI from 'openai';

// Load OpenAI API key from Firebase config or environment variable
const openai = new OpenAI({
  apiKey: functions.config().openai?.apikey || process.env.OPENAI_API_KEY || ""
});

/**
 * Wine price estimation function using OpenAI to search the web and find current retail prices.
 * This function takes a wine's details and a country code, and returns an estimated price range
 * in the local currency of the specified country.
 */
export const getPriceEstimate = functions
  .region('us-central1')
  .runWith({
    timeoutSeconds: 300,
    memory: '1GB',
    invoker: 'public' // Allow public access without authentication
  })
  .https.onCall(async (data, context) => {
    try {
      const { wine, country = 'US', currency = 'USD' } = data;
      
      if (!wine || !wine.name) {
        throw new functions.https.HttpsError(
          'invalid-argument', 
          'Wine details are required (must include at least name)'
        );
      }

      console.log(`Getting price estimate for wine: ${wine.name} in country: ${country} (${currency})`);
      
      // Construct the search query
      const vintage = wine.vintage || wine.year || '';
      const producer = wine.producer || wine.winery || '';
      const region = wine.region || '';
      const varietal = wine.varietal || wine.grapeVariety || '';
      
      const wineDescription = `${vintage} ${producer} ${wine.name} ${region} ${varietal}`.trim();
      const searchQuery = `current retail price of ${wineDescription} wine in ${country}`;
      
      console.log(`Search query: ${searchQuery}`);
      
      // Use OpenAI's web search capability to find pricing information
      const priceResponse = await openai.chat.completions.create({
        model: "gpt-4o-search-preview", // Using search-enabled model
        web_search_options: {}, // Enable web search
        messages: [
          {
            role: "system",
            content: `You are a wine pricing expert. I need you to search the web for the current retail price of a specific wine in a given country. Use multiple sources to find the most accurate and up-to-date pricing information. 
            
Your response should include:
1. The estimated retail price range in the local currency
2. The specific currency code
3. Confidence level (high, medium, low)
4. Sources used for the estimate
5. Any notable price variations you found

Format your response as valid JSON:
{
  "priceRange": {
    "min": number,
    "max": number
  },
  "currency": "ISO currency code",
  "confidence": "high/medium/low",
  "sources": ["source1", "source2", ...],
  "notes": "Any relevant notes about the price estimate"
}

If you cannot find pricing information for the specific vintage, try to find prices for similar vintages from the same producer. If the wine is not available in the requested country, provide pricing from the closest available market and note this in your response.`
          },
          {
            role: "user",
            content: `Find the current retail price of this wine in ${country} (${currency}): ${wineDescription}`
          }
        ],
        response_format: { type: "json_object" }
      });
      
      const result = JSON.parse(priceResponse.choices[0]?.message?.content || '{}');
      
      console.log('Price estimate result:', result);
      
      return {
        success: true,
        wine: wine,
        priceEstimate: result,
        country,
        currency
      };
    } catch (error: any) {
      console.error('Error estimating wine price:', error);
      
      return {
        success: false,
        message: error.message || 'Error estimating wine price',
        error: error.toString()
      };
    }
  });