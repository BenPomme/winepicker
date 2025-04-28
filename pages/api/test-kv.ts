import type { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Test KV connection
    console.log("Testing KV connection...");
    await kv.ping();
    console.log("KV connection successful");

    // Try to set a test value
    const testKey = 'test-kv-connection';
    await kv.set(testKey, { test: 'value' });
    console.log("Successfully set test value");

    // Try to get the test value
    const testValue = await kv.get(testKey);
    console.log("Successfully retrieved test value:", testValue);

    // Clean up
    await kv.del(testKey);
    console.log("Successfully deleted test value");

    return res.status(200).json({ 
      success: true, 
      message: 'KV connection test successful',
      testValue
    });
  } catch (error) {
    console.error("KV connection test failed:", error);
    return res.status(500).json({ 
      success: false, 
      message: 'KV connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 