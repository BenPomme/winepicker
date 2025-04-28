import type { NextApiRequest, NextApiResponse } from 'next';

// Local storage for mock KV data
let mockKVStorage: Record<string, any> = {};

// Mock KV API for local development
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    // Set/update a key
    const { key, value } = req.body;
    
    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }
    
    mockKVStorage[key] = value;
    return res.status(200).json({ success: true, key, value });
  } 
  else if (req.method === 'GET') {
    // Get a key
    const { key } = req.query;
    
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ error: 'Key is required' });
    }
    
    return res.status(200).json({ 
      success: true, 
      key, 
      value: mockKVStorage[key] || null 
    });
  }
  else if (req.method === 'DELETE') {
    // Delete a key
    const { key } = req.query;
    
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ error: 'Key is required' });
    }
    
    delete mockKVStorage[key];
    return res.status(200).json({ success: true, key });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}