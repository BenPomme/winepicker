import type { NextApiRequest, NextApiResponse } from 'next';
import { updateWinePrice } from '../../utils/userWines';

// API handler to update wine price in the database
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the request data
    const { wineId, userId, price, currency } = req.body;

    // Validate required parameters
    if (!wineId || !userId || !price || !currency) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // Skip token verification for now as it requires admin setup
    // In a production app, you would verify the token with Firebase Admin SDK

    // Update the wine price in the database
    await updateWinePrice(userId, wineId, price, currency);

    // Return success
    return res.status(200).json({
      success: true,
      message: 'Price updated successfully'
    });
  } catch (error) {
    console.error('Error updating wine price:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating wine price'
    });
  }
}