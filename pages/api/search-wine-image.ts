import { NextApiRequest, NextApiResponse } from 'next';

type SearchResponse = {
  success: boolean;
  imageUrl?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { wineName, producer } = req.query;

  if (!wineName || typeof wineName !== 'string') {
    return res.status(400).json({ success: false, error: 'Wine name is required' });
  }

  try {
    const searchQuery = `${producer ? producer + ' ' : ''}${wineName} wine bottle`;
    
    const response = await fetch('https://google.serper.dev/images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.SERPER_API_KEY || '',
      },
      body: JSON.stringify({
        q: searchQuery,
        gl: 'us',
        hl: 'en',
      }),
    });

    if (!response.ok) {
      throw new Error(`Serper API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Get the first image result
    const imageUrl = data.images?.[0]?.url;
    
    if (!imageUrl) {
      return res.status(404).json({ success: false, error: 'No images found' });
    }

    return res.status(200).json({ success: true, imageUrl });
  } catch (error: any) {
    console.error('Error searching for wine image:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to search for wine image' 
    });
  }
} 